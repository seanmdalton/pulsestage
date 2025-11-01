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

/**
 * Seeds demo questions and data for the default tenant
 * Can be called directly or imported as a function for reuse
 * Matches the comprehensive demo data from server.ts
 */
export async function seedDemoData(prisma: PrismaClient, tenantId: string): Promise<void> {
  console.log('🎭 Seeding demo data...');

  // Clear existing questions to prevent duplicates
  console.log('🗑  Clearing existing questions...');
  await prisma.question.deleteMany({
    where: { tenantId },
  });
  console.log('[OK] Existing questions cleared');

  // Get all teams for the tenant
  const teams = await prisma.team.findMany({
    where: { tenantId },
  });

  if (teams.length === 0) {
    throw new Error('No teams found. Run seed-teams.ts first.');
  }

  // Create or get demo users
  console.log('👥 Creating demo users...');

  // Real login users (4 total)
  const loginUsers = [
    {
      email: 'admin@pulsestage.app',
      name: 'Admin (Demo)',
      ssoId: 'admin',
      defaultRole: 'admin',
      primaryTeam: 'engineering',
      canLogin: true,
    },
    {
      email: 'alice@pulsestage.app',
      name: 'Alice (Demo User)',
      ssoId: 'alice',
      defaultRole: 'member',
      primaryTeam: 'engineering',
      canLogin: true,
    },
    {
      email: 'bob@pulsestage.app',
      name: 'Bob (Demo User)',
      ssoId: 'bob',
      defaultRole: 'member',
      primaryTeam: 'product',
      canLogin: true,
    },
    {
      email: 'moderator@pulsestage.app',
      name: 'Moderator (Demo)',
      ssoId: 'moderator',
      defaultRole: 'moderator',
      primaryTeam: 'product',
      canLogin: true,
    },
  ];

  // Dummy users with realistic names (46 total - doubled from 21)
  const engineeringNames = [
    'Sarah Chen',
    'Marcus Johnson',
    'Priya Patel',
    'David Kim',
    'Emily Rodriguez',
    'James Wilson',
    'Aisha Mohammed',
    "Ryan O'Connor",
    'Zara Ali',
    'Tom Anderson',
    'Maya Singh',
    'Kevin Liu',
    'Samantha White',
    'Raj Sharma',
    'Nicole Adams',
    'Tyler Brooks',
    'Jasmine Foster',
    'Connor Walsh',
    'Aaliyah Green',
    'Brandon Scott',
    'Mia Cooper',
    'Derek Hayes',
    'Luna Patel',
  ];

  const productNames = [
    'Jessica Taylor',
    'Michael Brown',
    'Sophia Garcia',
    'Daniel Lee',
    'Olivia Martinez',
    'Chris Thompson',
    'Fatima Hassan',
    'Alex Rivera',
    'Grace Park',
    'Jordan Smith',
    'Ethan Clark',
    'Isabella Reed',
    'Nathan Moore',
    'Ava Bennett',
    'Lucas Torres',
    'Emma Collins',
    'Mason Wright',
    'Chloe Murphy',
    'Logan Baker',
    'Lily Hughes',
    'Caleb Fisher',
    'Zoe Russell',
    'Noah Campbell',
  ];

  const dummyUsers = [
    ...engineeringNames.map(name => ({
      email: name.toLowerCase().replace(/['\s]/g, '.') + '@pulsestage.app',
      name,
      ssoId: name.toLowerCase().replace(/['\s]/g, '-'),
      defaultRole: 'member' as const,
      primaryTeam: 'engineering',
      canLogin: false,
    })),
    ...productNames.map(name => ({
      email: name.toLowerCase().replace(/['\s]/g, '.') + '@pulsestage.app',
      name,
      ssoId: name.toLowerCase().replace(/['\s]/g, '-'),
      defaultRole: 'member' as const,
      primaryTeam: 'product',
      canLogin: false,
    })),
  ];

  const demoUsersConfig = [...loginUsers, ...dummyUsers];

  const userMap: Record<string, any> = {};

  for (const userData of demoUsersConfig) {
    // Find the primary team
    const primaryTeam = teams.find(t => t.slug === userData.primaryTeam);
    if (!primaryTeam) {
      throw new Error(
        `Primary team "${userData.primaryTeam}" not found for user ${userData.email}`
      );
    }

    const user = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenantId,
          email: userData.email,
        },
      },
      update: {
        name: userData.name,
        ssoId: userData.ssoId,
        primaryTeamId: primaryTeam.id,
      },
      create: {
        email: userData.email,
        name: userData.name,
        ssoId: userData.ssoId,
        tenantId: tenantId,
        primaryTeamId: primaryTeam.id,
      },
    });

    console.log(`  [OK] ${userData.name} (Primary: ${primaryTeam.name})`);
    userMap[userData.ssoId] = user;

    // Create user preferences if they don't exist
    await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        tenantId: tenantId,
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

  // Sample questions with diverse content across teams
  const sampleQuestions = [
    // === ENGINEERING TEAM - 5 Open, 5 Answered ===
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
      body: 'How do we handle security vulnerabilities in dependencies?',
      teamSlug: 'engineering',
      authorId: userMap.moderator?.id,
      upvotes: 6,
      answered: true,
      response:
        'We use Dependabot for automated dependency updates and Snyk for vulnerability scanning. All high/critical vulnerabilities must be patched within 48 hours. For production systems, create a hotfix branch and fast-track through review. See our security runbook for details.',
    },
    {
      body: 'What is our code review process and SLA?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 12,
      answered: true,
      response:
        'All PRs require at least 2 approvals from team members. Our SLA is 24 hours for first review, 48 hours for approval. Use the #code-review Slack channel to request urgent reviews. PRs should be under 400 lines when possible. See our engineering handbook for detailed guidelines.',
    },
    {
      body: 'What database migration strategy should I use for backward compatibility?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 9,
      answered: true,
      response:
        'Always use a multi-phase approach: 1) Deploy schema changes (additive only), 2) Deploy app code that works with old and new schema, 3) Migrate data, 4) Deploy code using new schema, 5) Remove old columns. Never drop columns in the same release. Check out docs.internal/migrations for examples.',
    },
    {
      body: 'How do we do load testing before major releases?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 7,
      answered: true,
      response:
        'We use k6 for load testing. Create a test script in /tests/load/, target our staging environment, and aim for 3x expected peak traffic. Run tests at least 48 hours before release. Document results in the release ticket. The SRE team can help if you need assistance with test scenarios.',
    },
    {
      body: 'Should we migrate from REST to GraphQL for our public API?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 15,
      answered: false,
    },
    {
      body: 'What is the plan for upgrading to Node.js 22 LTS?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 11,
      answered: false,
    },
    {
      body: 'Can we adopt Rust for performance-critical microservices?',
      teamSlug: 'engineering',
      authorId: userMap.moderator?.id,
      upvotes: 14,
      answered: false,
    },
    {
      body: 'How do we handle database connection pooling in our Node services?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 5,
      answered: false,
    },
    {
      body: 'What is our disaster recovery plan for the production database?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 13,
      answered: false,
    },

    // === MORE ENGINEERING QUESTIONS (Doubled) ===
    {
      body: 'What are the best practices for error handling in our microservices?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 12,
      answered: true,
      response:
        "Our 2025 remote work policy offers full flexibility: work from home, hybrid, or in-office based on your preference and team needs. We've expanded our home office stipend to $1500/year and added quarterly team offsites for remote employees.",
    },
    {
      body: 'How does the parental leave policy work?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 16,
      answered: true,
      response:
        'We offer 16 weeks of paid parental leave for all parents (birth, adoption, foster). Leave can be taken within the first year and can be split into multiple periods. We also offer a flexible return-to-work program with reduced hours for the first month back. Contact HR to start the process.',
    },
    {
      body: 'What professional development budget do we have?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 19,
      answered: true,
      response:
        'Each employee has $2,000/year for professional development. This covers conferences, courses, books, certifications, and coaching. Submit requests through the PD portal. Unused budget does not roll over. We also have company-wide licenses for LinkedIn Learning and Pluralsight.',
    },
    {
      body: 'How does the performance review process work?',
      teamSlug: 'engineering',
      authorId: userMap.moderator?.id,
      upvotes: 14,
      answered: true,
      response:
        'Reviews happen twice per year (June and December). The process includes: 1) Self-assessment, 2) Peer feedback (3-5 colleagues), 3) Manager review, 4) Calibration with leadership, 5) 1:1 discussion. Reviews focus on impact, growth, and collaboration. Promotion discussions happen during the December cycle.',
    },
    {
      body: 'What is the employee referral bonus program?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 10,
      answered: true,
      response:
        'Refer qualified candidates and earn $3,000 for engineering roles, $2,000 for other roles. Bonus is paid after the new hire completes 90 days. You can track your referrals in the HR portal. We also run quarterly contests with additional prizes for top referrers.',
    },
    {
      body: 'When will the new benefits package be announced?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 18,
      answered: false,
    },
    {
      body: 'Can we add mental health days to our PTO policy?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 22,
      answered: false,
    },
    {
      body: 'What is the policy for attending conferences and events?',
      teamSlug: 'engineering',
      authorId: userMap.alice?.id,
      upvotes: 8,
      answered: false,
    },
    {
      body: 'How do I nominate someone for employee of the month?',
      teamSlug: 'engineering',
      authorId: userMap.moderator?.id,
      upvotes: 6,
      answered: false,
    },
    {
      body: 'What support is available for employees relocating to a new city?',
      teamSlug: 'engineering',
      authorId: userMap.bob?.id,
      upvotes: 11,
      answered: false,
    },

    // === PRODUCT TEAM - 5 Open, 5 Answered ===
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
      body: 'How do we gather and prioritize customer feedback?',
      teamSlug: 'product',
      authorId: userMap.bob?.id,
      upvotes: 13,
      answered: true,
      response:
        'We use Productboard to centralize feedback from support tickets, sales calls, user interviews, and surveys. Product managers review feedback weekly and tag items by theme. Prioritization considers: customer impact, revenue potential, strategic alignment, and effort. Top requests are discussed in monthly roadmap reviews.',
    },
    {
      body: 'What is our mobile app strategy for iOS vs Android?',
      teamSlug: 'product',
      authorId: userMap.alice?.id,
      upvotes: 11,
      answered: true,
      response:
        'We maintain feature parity between iOS and Android, but may stagger releases by 1-2 weeks for complex features. We use React Native for shared code (70% of codebase). Platform-specific features follow native guidelines. iOS typically releases first due to our user demographics (65% iOS).',
    },
    {
      body: 'How do we measure product-market fit?',
      teamSlug: 'product',
      authorId: userMap.moderator?.id,
      upvotes: 17,
      answered: true,
      response:
        'We track several indicators: 1) NPS score (currently 42), 2) Retention cohorts (D7, D30, D90), 3) Sean Ellis test ("How disappointed if product disappeared?" - targeting 40%+ "very disappointed"), 4) Organic growth rate, 5) Customer acquisition cost trends. We review these metrics monthly in the product board meeting.',
    },
    {
      body: 'What tools do we use for product analytics?',
      teamSlug: 'product',
      authorId: userMap.bob?.id,
      upvotes: 8,
      answered: true,
      response:
        'Our analytics stack: Mixpanel for event tracking, Amplitude for cohort analysis, Hotjar for session recordings, UserTesting for qualitative research. All PMs have access. Check out the analytics playbook for tracking plan standards and common queries.',
    },
    {
      body: 'What is our approach to AI and machine learning in our products?',
      teamSlug: 'product',
      authorId: userMap.bob?.id,
      upvotes: 20,
      answered: false,
    },
    {
      body: 'Should we build a desktop app or focus on web PWA?',
      teamSlug: 'product',
      authorId: userMap.alice?.id,
      upvotes: 16,
      answered: false,
    },
    {
      body: 'How do we balance new features vs technical debt?',
      teamSlug: 'product',
      authorId: userMap.moderator?.id,
      upvotes: 19,
      answered: false,
    },
    {
      body: 'What is the strategy for international expansion and localization?',
      teamSlug: 'product',
      authorId: userMap.bob?.id,
      upvotes: 12,
      answered: false,
    },
    {
      body: 'How do we approach accessibility (WCAG compliance) in product design?',
      teamSlug: 'product',
      authorId: userMap.alice?.id,
      upvotes: 14,
      answered: false,
    },

    // === GENERAL TEAM - Mix of questions ===
    {
      body: 'Can we get standing desks in the new office?',
      teamSlug: 'product',
      authorId: userMap.bob?.id,
      upvotes: 23,
      answered: false,
    },
    {
      body: 'How can I submit expenses for the team offsite?',
      teamSlug: 'product',
      authorId: userMap.alice?.id,
      upvotes: 5,
      answered: true,
      response:
        'Use Expensify to submit expenses within 30 days. Tag them with "Team Offsite Q1" and include receipts. Approved items: transportation, accommodation, team meals. Manager approval required for expenses over $500.',
    },
    // Questions under review (flagged by moderation)
    {
      body: 'Why do we keep having these STUPID meetings that accomplish NOTHING???',
      teamSlug: 'product',
      authorId: userMap.bob?.id,
      upvotes: 3,
      underReview: true,
      moderationReasons: ['Excessive capitalization'],
      moderationConfidence: 'medium',
      moderationProviders: ['local'],
    },
    {
      body: 'Can someone explain the new PTO policy? I heard conflicting info from HR.',
      teamSlug: 'engineering',
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
    where: { tenantId },
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

    // Precompute values to avoid Prisma parsing issues
    const now = new Date();
    const questionStatus = (q as any).underReview
      ? 'UNDER_REVIEW'
      : q.answered
        ? 'ANSWERED'
        : 'OPEN';
    const responseDate = q.answered ? now : null;

    // Build create data with explicit fields only
    const question = await prisma.question.create({
      data: {
        body: q.body,
        teamId: team.id,
        tenantId: tenantId,
        authorId: q.authorId || null,
        upvotes: q.upvotes,
        status: questionStatus,
        responseText: q.response || null,
        respondedAt: responseDate,
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
    `  [OK] Created ${questionCount} sample questions (${underReviewCount} under review)`
  );
  console.log(' Demo data seeding completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const prisma = new PrismaClient();

  (async () => {
    try {
      // Get or create default tenant
      const tenant = await prisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
          slug: 'default',
          name: 'Default Organization',
        },
      });

      await seedDemoData(prisma, tenant.id);
    } catch (error) {
      console.error('[ERROR] Demo data seeding failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  })();
}
