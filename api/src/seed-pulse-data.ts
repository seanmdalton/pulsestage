/* eslint-disable no-process-exit */
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

import { PrismaClient, PulseScale } from '@prisma/client';

const prisma = new PrismaClient();

// Sample Pulse questions covering key engagement areas
const PULSE_QUESTIONS = [
  {
    text: 'How recognized do you feel for your contributions this week?',
    category: 'recognition',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How aligned do you feel with team goals and priorities?',
    category: 'alignment',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How supported do you feel by your manager/team?',
    category: 'support',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How would you rate your work-life balance this week?',
    category: 'wellbeing',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How confident are you in the direction of the organization?',
    category: 'confidence',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How much opportunity do you have to learn and grow?',
    category: 'growth',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How effective is communication within your team?',
    category: 'communication',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How empowered do you feel to make decisions?',
    category: 'autonomy',
    scale: PulseScale.LIKERT_1_5,
  },
  {
    text: 'How likely are you to recommend this as a great place to work?',
    category: 'nps',
    scale: PulseScale.NPS_0_10,
  },
  {
    text: 'How energized do you feel about your work this week?',
    category: 'energy',
    scale: PulseScale.LIKERT_1_5,
  },
];

/**
 * Seed Pulse questions for a tenant
 */
export async function seedPulseQuestions(tenantId: string) {
  console.log(`🎯 Seeding Pulse questions for tenant ${tenantId}...`);

  for (const question of PULSE_QUESTIONS) {
    await prisma.pulseQuestion.upsert({
      where: {
        // Using a composite unique constraint would be ideal, but for now check by text+tenant
        id: `pulse-q-${tenantId}-${question.category}`,
      },
      update: {
        text: question.text,
        scale: question.scale,
        category: question.category,
      },
      create: {
        id: `pulse-q-${tenantId}-${question.category}`,
        tenantId,
        text: question.text,
        scale: question.scale,
        category: question.category,
        active: true,
      },
    });
  }

  console.log(`[OK] Seeded ${PULSE_QUESTIONS.length} Pulse questions`);
}

/**
 * Create a Pulse schedule for a tenant
 */
export async function seedPulseSchedule(tenantId: string) {
  console.log(`📅 Creating Pulse schedule for tenant ${tenantId}...`);

  await prisma.pulseSchedule.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      cadence: 'WEEKLY',
      dayOfWeek: 1, // Monday
      timeOfDay: '09:00',
      rotatingCohorts: true,
      enabled: process.env.PULSE_ENABLED === 'true',
    },
  });

  console.log('[OK] Pulse schedule created');
}

/**
 * Create cohorts for rotating invites
 */
export async function seedPulseCohorts(tenantId: string) {
  console.log(`👥 Creating Pulse cohorts for tenant ${tenantId}...`);

  // Get all users for this tenant
  const users = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true },
  });

  if (users.length === 0) {
    console.log('[WARNING]  No users found for cohort creation');
    return;
  }

  // Create 5 cohorts (for weekday rotation)
  const cohortSize = Math.ceil(users.length / 5);

  for (let i = 0; i < 5; i++) {
    const cohortUsers = users.slice(i * cohortSize, (i + 1) * cohortSize);
    const userIds = cohortUsers.map(u => u.id);

    await prisma.pulseCohort.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: `weekday-${i}`,
        },
      },
      update: {
        userIds: JSON.stringify(userIds),
      },
      create: {
        tenantId,
        name: `weekday-${i}`,
        userIds: JSON.stringify(userIds),
      },
    });
  }

  console.log(`[OK] Created 5 cohorts with ~${cohortSize} users each`);
}

/**
 * Generate synthetic Pulse responses for the last 8 weeks
 * This creates realistic-looking historical data for demo/testing
 */
export async function seedPulseResponses(tenantId: string, weeks = 8) {
  console.log(`📊 Generating synthetic Pulse responses for ${weeks} weeks...`);

  const questions = await prisma.pulseQuestion.findMany({
    where: { tenantId, active: true },
  });

  if (questions.length === 0) {
    console.log('[WARNING]  No Pulse questions found');
    return;
  }

  const users = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true },
  });

  if (users.length === 0) {
    console.log('[WARNING]  No users found');
    return;
  }

  let totalResponses = 0;

  // Generate responses for each of the last N weeks
  for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - weekOffset * 7);

    // Determine cohort for this week (rotate through 5 cohorts)
    const cohortIndex = weekOffset % 5;
    const cohortName = `weekday-${cohortIndex}`;

    // Get users for this cohort
    const cohort = await prisma.pulseCohort.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: cohortName,
        },
      },
    });

    let respondingUserIds: string[];

    // For recent weeks (0-3), have ALL users respond to ensure data above anonymity threshold
    // For older weeks, use cohort rotation with realistic participation
    if (weekOffset <= 3) {
      // All users respond for recent 4 weeks (ensures >= 5 responses per question for demo)
      respondingUserIds = users.map(u => u.id);
    } else {
      // Use cohort rotation for older weeks
      if (!cohort) continue;
      const cohortUserIds = JSON.parse(cohort.userIds as string) as string[];
      const participationRate = 0.7 + Math.random() * 0.2;
      respondingUserIds = cohortUserIds.filter(() => Math.random() < participationRate);
    }

    // Each user responds to all questions
    for (const _userId of respondingUserIds) {
      for (const question of questions) {
        // Generate realistic scores with slight trending
        // Base score around 3.5 for Likert (1-5) or 7 for NPS (0-10)
        // Add some variance and a slight improving trend over time
        let baseScore: number;
        let variance: number;

        if (question.scale === PulseScale.LIKERT_1_5) {
          baseScore = 3.5;
          variance = 1.2;
        } else {
          // NPS scale (0-10)
          baseScore = 7;
          variance = 2.5;
        }

        // Add improvement trend (older = slightly lower)
        const trendAdjustment = weekOffset * -0.05;

        // Add category-specific adjustments
        let categoryAdjustment = 0;
        if (question.category === 'recognition') categoryAdjustment = -0.3; // Slightly lower
        if (question.category === 'growth') categoryAdjustment = 0.2; // Slightly higher
        if (question.category === 'wellbeing') categoryAdjustment = -0.5; // Needs work

        // Calculate score with randomness
        let score =
          baseScore + (Math.random() - 0.5) * variance * 2 + trendAdjustment + categoryAdjustment;

        // Clamp to valid range
        if (question.scale === PulseScale.LIKERT_1_5) {
          score = Math.max(1, Math.min(5, Math.round(score)));
        } else {
          score = Math.max(0, Math.min(10, Math.round(score)));
        }

        // Randomly add comments for lower scores (engagement signal)
        let comment: string | null = null;
        if (score <= 3 && Math.random() < 0.3) {
          const comments = [
            'Would appreciate more visibility into team priorities',
            'Could use more support during peak times',
            'Looking forward to improvements in this area',
            'Some progress made but room for growth',
          ];
          comment = comments[Math.floor(Math.random() * comments.length)];
        }

        await prisma.pulseResponse.create({
          data: {
            tenantId,
            questionId: question.id,
            score: Math.round(score),
            comment,
            cohortName,
            submittedAt: weekDate,
          },
        });

        totalResponses++;
      }
    }
  }

  console.log(`[OK] Generated ${totalResponses} synthetic responses across ${weeks} weeks`);
}

/**
 * Main seed function - seeds everything for a tenant
 */
export async function seedPulseData(tenantSlug = 'default') {
  console.log('🎯 Seeding Weekly Pulse data...');

  try {
    // Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`[ERROR] Tenant '${tenantSlug}' not found`);
      return;
    }

    // Seed questions
    await seedPulseQuestions(tenant.id);

    // Seed schedule
    await seedPulseSchedule(tenant.id);

    // Seed cohorts
    await seedPulseCohorts(tenant.id);

    // Seed synthetic responses (8 weeks of history)
    await seedPulseResponses(tenant.id, 8);

    console.log('[OK] Pulse data seeded successfully!');
  } catch (error) {
    console.error('[ERROR] Error seeding Pulse data:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tenantSlug = process.argv[2] || 'default';
  seedPulseData(tenantSlug)
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
