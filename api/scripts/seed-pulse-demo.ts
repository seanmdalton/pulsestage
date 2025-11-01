#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Seed comprehensive Pulse demo data
 * Creates 8 weeks of realistic pulse responses for dashboard testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding comprehensive Pulse demo data...');

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
  });

  if (!tenant) {
    throw new Error('Default tenant not found');
  }

  // Get all teams
  const teams = await prisma.team.findMany({
    where: { tenantId: tenant.id },
  });

  // Get all users with their primary teams
  const users = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    include: { primaryTeam: true },
  });

  if (users.length === 0) {
    throw new Error('No users found');
  }

  console.log(` Found ${users.length} users`);

  // Get active questions
  const questions = await prisma.pulseQuestion.findMany({
    where: {
      tenantId: tenant.id,
      active: true,
    },
  });

  if (questions.length === 0) {
    throw new Error('No active pulse questions found');
  }

  console.log(` Found ${questions.length} active questions`);

  // Clean up existing data
  console.log(' Cleaning up existing pulse data...');
  await prisma.pulseResponse.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.pulseInvite.deleteMany({ where: { tenantId: tenant.id } });
  console.log('[OK] Cleanup complete');

  // Get users by team for team-specific trends
  const engineeringUsers = users.filter(
    u => u.primaryTeamId && teams.find(t => t.id === u.primaryTeamId)?.slug === 'engineering'
  );
  const productUsers = users.filter(
    u => u.primaryTeamId && teams.find(t => t.id === u.primaryTeamId)?.slug === 'product'
  );

  console.log(
    `📊 Team distribution: ${engineeringUsers.length} Engineering, ${productUsers.length} Product`
  );

  // Generate 12 weeks of data (going backwards in time, always relative to NOW)
  const weeksToGenerate = 12;
  let totalResponses = 0;
  let totalInvites = 0;

  console.log(
    `\n📊 Generating ${weeksToGenerate} weeks of data (all timestamps relative to now)...`
  );

  for (let weekOffset = 1; weekOffset <= weeksToGenerate; weekOffset++) {
    const now = new Date(); // Always use current time
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - weekOffset * 7);
    weekStart.setHours(9, 0, 0, 0); // Monday 9am

    console.log(`\n  Week ${weekOffset} ago (${weekStart.toISOString().split('T')[0]}):`);

    // Each week, send 2-3 questions to all users
    const questionsThisWeek = questions.slice(0, 2 + Math.floor(Math.random() * 2));

    for (const question of questionsThisWeek) {
      // Create invites for all users
      const invites = [];
      for (const user of users) {
        const sentAt = new Date(weekStart);
        sentAt.setHours(sentAt.getHours() + Math.random() * 2); // Stagger sends

        const expiresAt = new Date(sentAt);
        expiresAt.setDate(expiresAt.getDate() + 7);

        invites.push({
          tenantId: tenant.id,
          userId: user.id,
          teamId: user.primaryTeamId, // Associate with user's primary team
          questionId: question.id,
          status: 'SENT' as const,
          channel: 'EMAIL' as const,
          sentAt,
          expiresAt,
          token: `demo-${weekOffset}-${question.id.substring(0, 8)}-${user.id.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        });
      }

      // Create invites and get their IDs back
      const createdInvitesPromises = invites.map(invite =>
        prisma.pulseInvite.create({ data: invite })
      );
      const createdInvites = await Promise.all(createdInvitesPromises);

      totalInvites += createdInvites.length;

      // Simulate responses - 70-90% participation rate
      const participationRate = 0.7 + Math.random() * 0.2;
      const respondingUsers = users.slice(0, Math.floor(users.length * participationRate));

      for (const user of respondingUsers) {
        // Find the invite we just created for this user
        const invite = createdInvites.find(
          inv => inv.userId === user.id && inv.questionId === question.id
        );

        if (!invite) continue;

        // Generate realistic score with TEAM-SPECIFIC TRENDS
        let baseScore: number;
        const category = question.category || 'general';
        const userTeamSlug = user.primaryTeam?.slug;

        // Team-specific base scores with trends over time
        // weekOffset: 1 = most recent week, 12 = oldest week
        // Engineering: Improving trend (3.2 at week 12 → 3.8 at week 1)
        // Product: Declining trend (4.2 at week 12 → 3.9 at week 1)
        if (userTeamSlug === 'engineering') {
          // Engineering improving: low at week 12, high at week 1
          const trendFactor = (weeksToGenerate - weekOffset) / weeksToGenerate; // 0 at week 12, ~1 at week 1
          baseScore = 3.2 + 0.6 * trendFactor; // 3.2 → 3.8
        } else if (userTeamSlug === 'product') {
          // Product declining: high at week 12, low at week 1
          const trendFactor = (weeksToGenerate - weekOffset) / weeksToGenerate; // 0 at week 12, ~1 at week 1
          baseScore = 4.2 - 0.3 * trendFactor; // 4.2 → 3.9 (subtract as trend increases)
        } else {
          baseScore = 3.5; // Default for users without primary team
        }

        // Add category-specific variation (reduced to not drown out trend)
        let categoryAdjustment = 0;
        if (category.includes('recognition') || category.includes('support')) {
          categoryAdjustment = -0.15; // Recognition tends slightly lower
        } else if (category.includes('balance') || category.includes('workload')) {
          categoryAdjustment = -0.1; // Work-life balance varies slightly
        } else if (category.includes('growth') || category.includes('development')) {
          categoryAdjustment = 0.1; // Growth tends slightly higher
        }

        // Add random variance (reduced from ±0.5 to ±0.3 to preserve trend signal)
        const variance = (Math.random() - 0.5) * 0.6;

        // Calculate final score and clamp to 1-5
        let score = Math.round(baseScore + categoryAdjustment + variance);
        score = Math.max(1, Math.min(5, score)); // Clamp to 1-5

        // Response time: 1-48 hours after sent, but ensure it stays in the past
        const hoursAfterSent = 1 + Math.random() * 48;
        const respondedAt = new Date(
          (invite.sentAt || weekStart).getTime() + hoursAfterSent * 60 * 60 * 1000
        );

        // Ensure response is not in the future
        if (respondedAt > new Date()) {
          respondedAt.setTime(new Date().getTime() - Math.random() * 24 * 60 * 60 * 1000); // 0-24 hours ago
        }

        // Create anonymous response with team association
        await prisma.pulseResponse.create({
          data: {
            tenantId: tenant.id,
            teamId: user.primaryTeamId, // Associate with user's primary team
            questionId: question.id,
            score,
            cohortName: `weekday-${weekStart.getDay()}`,
            submittedAt: respondedAt,
          },
        });

        // Mark invite as completed
        await prisma.pulseInvite.update({
          where: { id: invite.id },
          data: {
            status: 'COMPLETED',
            completedAt: respondedAt,
          },
        });

        totalResponses++;
      }

      console.log(
        `    ✓ "${question.text.substring(0, 40)}...": ${respondingUsers.length}/${users.length} responses`
      );
    }
  }

  console.log(`\n[OK] Pulse demo data seeded successfully!`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total Invites: ${totalInvites}`);
  console.log(`   Total Responses: ${totalResponses}`);
  console.log(`   Overall Participation: ${((totalResponses / totalInvites) * 100).toFixed(1)}%`);
  console.log(`   Weeks of Data: ${weeksToGenerate}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Refresh the Pulse Dashboard: http://localhost:5173/admin/pulse`);
  console.log(`   2. You should now see:`);
  console.log(`      - Overall score trend (8 weeks)`);
  console.log(`      - Question breakdowns with charts`);
  console.log(`      - Participation rates`);
  console.log(`      - Weekly trends`);
}

main()
  .catch(e => {
    console.error('[ERROR] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
