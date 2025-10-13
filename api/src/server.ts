/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { initRedis } from './middleware/rateLimit.js';
import { initSessionStore } from './middleware/session.js';
import { createApp } from './app.js';
import { startEmailWorker } from './lib/queue/emailQueue.js';

const prisma = new PrismaClient();

// Auto-bootstrap: Create default tenant if database is empty
async function autoBootstrap() {
  try {
    const tenantCount = await prisma.tenant.count();

    if (tenantCount === 0) {
      console.log('🔧 Auto-bootstrap: No tenants found, creating default tenant...');

      await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
        },
      });

      console.log('✅ Auto-bootstrap: Default tenant created');
    }
  } catch (error) {
    console.warn('Auto-bootstrap failed:', error);
  }
}

// Auto-seed demo users and data in development mode
async function seedDemoData() {
  if (process.env.NODE_ENV !== 'development') {
    return; // Only seed in development
  }

  try {
    console.log('🌱 Development mode: Seeding demo data...');

    // Import existing seed functions
    const { seedTeams } = await import('./seed-teams.js');
    const { seedTags } = await import('./seed-tags.js');

    // Run existing seed scripts (they're idempotent)
    await seedTeams();
    await seedTags();

    // Get default tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    if (!tenant) {
      console.warn('⚠️  Default tenant not found, skipping demo user seeding');
      return;
    }

    // Create demo-specific users (for demo mode authentication)
    console.log('👥 Creating demo users...');
    const demoUsers = [
      {
        email: 'alice@demo.pulsestage.dev',
        name: 'Alice (Demo User)',
        ssoId: 'alice',
        defaultRole: 'member',
      },
      {
        email: 'bob@demo.pulsestage.dev',
        name: 'Bob (Demo User)',
        ssoId: 'bob',
        defaultRole: 'member',
      },
      {
        email: 'moderator@demo.pulsestage.dev',
        name: 'Moderator (Demo)',
        ssoId: 'moderator',
        defaultRole: 'moderator',
      },
      {
        email: 'admin@demo.pulsestage.dev',
        name: 'Admin (Demo)',
        ssoId: 'admin',
        defaultRole: 'admin',
      },
    ];

    // Get all teams for the tenant
    const teams = await prisma.team.findMany({
      where: { tenantId: tenant.id },
    });

    if (teams.length === 0) {
      console.warn('⚠️  No teams found, skipping demo user seeding');
      return;
    }

    for (const userData of demoUsers) {
      const user = await prisma.user.upsert({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: userData.email,
          },
        },
        update: {
          name: userData.name,
          ssoId: userData.ssoId,
        },
        create: {
          email: userData.email,
          name: userData.name,
          ssoId: userData.ssoId,
          tenantId: tenant.id,
        },
      });

      console.log(`  ✅ ${userData.name}`);

      // Create user preferences if they don't exist
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          tenantId: tenant.id,
          favoriteTeams: [],
          emailNotifications: false, // Disable for demo
        },
      });

      // Add user to all teams with appropriate role
      for (const team of teams) {
        await prisma.teamMembership.upsert({
          where: {
            userId_teamId: {
              userId: user.id,
              teamId: team.id,
            },
          },
          update: {
            role: userData.defaultRole,
          },
          create: {
            userId: user.id,
            teamId: team.id,
            role: userData.defaultRole,
          },
        });
      }
    }

    console.log('\n✨ Demo data ready! Login at: http://localhost:5173/login');
    console.log('   👤 Demo users: alice, bob, moderator, admin');
    console.log('   🏢 Teams: Use existing teams from seed-teams.ts');
    console.log('   🏷️  Tags: Use existing tags from seed-tags.ts\n');
  } catch (error) {
    console.warn('⚠️  Demo data seeding failed:', error);
    console.warn('   This is non-blocking - continuing startup...');
  }
}

// Initialize Redis and start server
async function start() {
  // Initialize Redis for rate limiting (non-blocking)
  try {
    await initRedis();
  } catch (error) {
    console.warn('Redis initialization failed, continuing without rate limiting:', error);
  }

  // Initialize Redis for sessions (non-blocking)
  try {
    await initSessionStore();
  } catch (error) {
    console.warn('Session store initialization failed, using memory store:', error);
  }

  // Start email worker (non-blocking)
  try {
    startEmailWorker();
  } catch (error) {
    console.warn('Email worker initialization failed, emails will not be sent:', error);
  }

  const app = createApp(prisma);

  app.listen(env.PORT, async () => {
    // Ensure schema is present when running outside CI/container
    try {
      await prisma.$executeRawUnsafe('SELECT 1');
      console.log('Database connection verified');

      // Auto-bootstrap if needed
      await autoBootstrap();

      // Seed demo data in development mode
      await seedDemoData();
    } catch (error) {
      console.warn('Database connection check failed:', error);
    }
    console.log(`ama-api listening on :${env.PORT}`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}`);
    console.log(`Admin key: ${env.ADMIN_KEY ? 'configured' : 'not configured'}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch(console.error);
