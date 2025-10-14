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

    // Create sample questions for demo
    console.log('❓ Creating sample questions...');
    const userMap = Object.fromEntries(
      await Promise.all(
        demoUsers.map(async u => {
          const user = await prisma.user.findFirst({
            where: { email: u.email, tenantId: tenant.id },
          });
          return [u.ssoId, user];
        })
      )
    );

    const sampleQuestions = [
      {
        body: 'What is our remote work policy for 2025?',
        teamSlug: 'people',
        authorId: userMap.alice?.id,
        upvotes: 12,
        answered: true,
        response:
          "Our 2025 remote work policy offers full flexibility: work from home, hybrid, or in-office based on your preference and team needs. We've expanded our home office stipend to $1500/year and added quarterly team offsites for remote employees.",
      },
      {
        body: 'How do I get started with our new CI/CD pipeline?',
        teamSlug: 'engineering',
        authorId: userMap.bob?.id,
        upvotes: 8,
        answered: true,
        response:
          'Great question! Check out the new CI/CD docs at docs.internal/cicd. The key steps are: 1) Add a .github/workflows/deploy.yml to your repo, 2) Configure environment secrets, 3) Push to main. The pipeline automatically runs tests, builds, and deploys to staging. Reach out in #dev-ops if you need help!',
      },
      {
        body: 'What are the key product priorities for Q1?',
        teamSlug: 'product',
        authorId: userMap.alice?.id,
        upvotes: 15,
        answered: true,
        response:
          'Our Q1 priorities are: 1) Mobile app redesign (40% of resources), 2) Performance optimization - targeting 50% faster load times, 3) Enterprise SSO integration for our biggest customers. Check out the full roadmap in the #product-updates channel!',
      },
      {
        body: 'Can we get standing desks in the new office?',
        teamSlug: 'general',
        authorId: userMap.bob?.id,
        upvotes: 23,
        answered: false,
      },
      {
        body: 'When will the new benefits package be announced?',
        teamSlug: 'people',
        authorId: userMap.alice?.id,
        upvotes: 18,
        answered: false,
      },
      {
        body: 'How do we handle security vulnerabilities in dependencies?',
        teamSlug: 'engineering',
        authorId: userMap.moderator?.id,
        upvotes: 6,
        answered: true,
        response:
          'We use Dependabot for automated dependency updates and Snyk for vulnerability scanning. All high/critical vulnerabilities must be patched within 48 hours. For production systems, create a hotfix branch and fast-track through review. See our security runbook for details.',
      },
      {
        body: 'What is our approach to AI and machine learning in our products?',
        teamSlug: 'product',
        authorId: userMap.bob?.id,
        upvotes: 20,
        answered: false,
      },
      {
        body: 'How can I submit expenses for the team offsite?',
        teamSlug: 'general',
        authorId: userMap.alice?.id,
        upvotes: 5,
        answered: true,
        response:
          'Use Expensify to submit expenses within 30 days. Tag them with "Team Offsite Q1" and include receipts. Approved items: transportation, accommodation, team meals. Manager approval required for expenses over $500.',
      },
      // Questions under review (flagged by moderation)
      {
        body: 'Why do we keep having these STUPID meetings that accomplish NOTHING???',
        teamSlug: 'general',
        authorId: userMap.bob?.id,
        upvotes: 3,
        underReview: true,
        moderationReasons: ['Excessive capitalization'],
        moderationConfidence: 'medium',
        moderationProviders: ['local'],
      },
      {
        body: 'Can someone explain the new PTO policy? I heard conflicting info from HR.',
        teamSlug: 'people',
        authorId: userMap.alice?.id,
        upvotes: 7,
        underReview: true,
        moderationReasons: ['Contains profanity'],
        moderationConfidence: 'low',
        moderationProviders: ['local'],
      },
      {
        body: 'What is the roadmap for our API deprecation? Need to plan migrations.',
        teamSlug: 'engineering',
        authorId: userMap.moderator?.id,
        upvotes: 4,
        underReview: true,
        moderationReasons: ['Spam detected (excessive URLs, numbers, or repeated characters)'],
        moderationConfidence: 'medium',
        moderationProviders: ['local'],
      },
      {
        body: 'How are we measuring customer satisfaction and NPS for our new features?',
        teamSlug: 'product',
        authorId: userMap.bob?.id,
        upvotes: 9,
        underReview: true,
        moderationReasons: ['Contains profanity'],
        moderationConfidence: 'low',
        moderationProviders: ['local'],
      },
    ];

    // Get all tags for categorization
    const allTags = await prisma.tag.findMany({
      where: { tenantId: tenant.id },
    });

    const tagMap: Record<string, any> = {};
    for (const tag of allTags) {
      tagMap[tag.name.toLowerCase()] = tag;
    }

    let questionCount = 0;
    let underReviewCount = 0;
    for (const q of sampleQuestions) {
      const team = teams.find(t => t.slug === q.teamSlug);
      if (!team) continue;

      const question = await prisma.question.create({
        data: {
          body: q.body,
          team: { connect: { id: team.id } },
          author: q.authorId ? { connect: { id: q.authorId } } : undefined,
          upvotes: q.upvotes,
          status: (q as any).underReview ? 'UNDER_REVIEW' : q.answered ? 'ANSWERED' : 'OPEN',
          responseText: q.response || null,
          respondedAt: q.answered ? new Date() : null,
          tenant: { connect: { id: tenant.id } },
          // Moderation metadata for under-review questions
          moderationReasons: (q as any).moderationReasons || [],
          moderationConfidence: (q as any).moderationConfidence || null,
          moderationProviders: (q as any).moderationProviders || [],
        },
      });

      if ((q as any).underReview) {
        underReviewCount++;
      }

      // Auto-tag questions based on content
      if (q.body.toLowerCase().includes('remote') && tagMap.remote) {
        await prisma.questionTag.create({
          data: { questionId: question.id, tagId: tagMap.remote.id },
        });
      }
      if (
        (q.body.toLowerCase().includes('benefit') || q.body.toLowerCase().includes('office')) &&
        tagMap.benefits
      ) {
        await prisma.questionTag.create({
          data: { questionId: question.id, tagId: tagMap.benefits.id },
        });
      }
      if (q.body.toLowerCase().includes('product') && tagMap.product) {
        await prisma.questionTag.create({
          data: { questionId: question.id, tagId: tagMap.product.id },
        });
      }
      if (
        (q.body.toLowerCase().includes('engineering') ||
          q.body.toLowerCase().includes('ci/cd') ||
          q.body.toLowerCase().includes('security')) &&
        tagMap.engineering
      ) {
        await prisma.questionTag.create({
          data: { questionId: question.id, tagId: tagMap.engineering.id },
        });
      }

      questionCount++;
    }

    console.log(
      `  ✅ Created ${questionCount} sample questions (${underReviewCount} under review)\n`
    );

    console.log('✨ Demo data ready! Login at: http://localhost:5173/login');
    console.log('   👤 Demo users: alice, bob, moderator, admin');
    console.log('   🏢 Teams: General, Engineering, Product, People');
    console.log('   🏷️  Tags: Multiple tags for organization');
    console.log(
      `   ❓ Questions: ${questionCount} total (${underReviewCount} awaiting moderation)\n`
    );
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
        await seedDemoData();

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
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
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
    process.exit(1);
  }
}

start();
