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

import { env } from './env.js';
import { initRedis } from './middleware/rateLimit.js';
import { initSessionStore } from './middleware/session.js';
import { createApp } from './app.js';
import { startEmailWorker } from './lib/queue/emailQueue.js';
import {
  createPrismaClient,
  validateDatabaseConnection,
  shutdownDatabase,
} from './lib/database.js';

const prisma = createPrismaClient();

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
async function seedDevelopmentData() {
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

    // Use reusable seedDemoData for questions
    console.log('❓ Creating sample questions...');
    const { seedDemoData } = await import('./seed-demo-data.js');
    await seedDemoData(prisma, tenant.id);

    console.log('✨ Demo data ready! Login at: http://localhost:5173/login');
    console.log('   👤 Demo users: alice, bob, moderator, admin');
    console.log('   🏢 Teams: General, Engineering, Product, People');
    console.log('   🏷️  Tags: Multiple tags for organization');
    console.log('   ❓ Questions: 12 total (4 awaiting moderation)\n');
  } catch (error) {
    console.warn('⚠️  Demo data seeding failed:', error);
    console.warn('   This is non-blocking - continuing startup...');
  }
}

// Initialize services and start server
async function start() {
  try {
    // 1. Validate database connection and pool settings
    console.log('🔌 Connecting to database...');
    await validateDatabaseConnection(prisma);

    // 2. Initialize Redis for rate limiting
    console.log('🔒 Initializing rate limiting...');
    await initRedis();

    // 3. Initialize Redis for session storage
    console.log('🍪 Initializing session storage...');
    await initSessionStore();

    // 4. Start email worker
    console.log('📧 Starting email worker...');
    startEmailWorker();

    // 5. Create Express app
    const app = createApp(prisma);

    // 6. Start HTTP server
    const server = app.listen(env.PORT, async () => {
      try {
        // Auto-bootstrap if needed
        await autoBootstrap();

        // Seed demo data in development mode
        await seedDevelopmentData();

        console.log('');
        console.log('🚀 Server ready!');
        console.log(`   Port: ${env.PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   CORS origin: ${env.CORS_ORIGIN}`);
        console.log(`   Admin key: ${env.ADMIN_KEY ? '✓ configured' : '✗ not configured'}`);
        console.log('');
      } catch (error) {
        console.error('Startup tasks failed:', error);
      }
    });

    // 7. Setup graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log('');
      console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          // Disconnect from database
          await shutdownDatabase(prisma);

          // Exit successfully
          // eslint-disable-next-line no-process-exit
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

start();
