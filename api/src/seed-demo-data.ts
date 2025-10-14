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

  // Get all teams for the tenant
  const teams = await prisma.team.findMany({
    where: { tenantId },
  });

  if (teams.length === 0) {
    throw new Error('No teams found. Run seed-teams.ts first.');
  }

  // Get demo users
  const demoUsers = ['alice', 'bob', 'moderator', 'admin'];
  const userMap = Object.fromEntries(
    await Promise.all(
      demoUsers.map(async ssoId => {
        const user = await prisma.user.findFirst({
          where: {
            ssoId,
            tenantId,
          },
        });
        return [ssoId, user];
      })
    )
  );

  if (!userMap.alice || !userMap.bob) {
    throw new Error('Demo users not found. Ensure users are seeded first.');
  }

  // Sample questions matching server.ts
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

    const question = await prisma.question.create({
      data: {
        body: q.body,
        team: { connect: { id: team.id } },
        author: q.authorId ? { connect: { id: q.authorId } } : undefined,
        upvotes: q.upvotes,
        status: (q as any).underReview ? 'UNDER_REVIEW' : q.answered ? 'ANSWERED' : 'OPEN',
        responseText: q.response || null,
        respondedAt: q.answered ? new Date() : null,
        tenant: { connect: { id: tenantId } },
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

  console.log(`  ✅ Created ${questionCount} sample questions (${underReviewCount} under review)`);
  console.log('🎉 Demo data seeding completed!');
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
          id: 'default-tenant-id',
          slug: 'default',
          name: 'Default Tenant',
        },
      });

      await seedDemoData(prisma, tenant.id);
    } catch (error) {
      console.error('❌ Demo data seeding failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  })();
}
