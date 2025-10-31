#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Validate team-specific pulse trends
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamTrends() {
  console.log('🔍 Analyzing team-specific pulse trends...\n');

  const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
  if (!tenant) throw new Error('No tenant');

  const teams = await prisma.team.findMany({ where: { tenantId: tenant.id } });

  for (const team of teams) {
    if (team.slug === 'general') continue; // Skip general

    console.log(`📊 ${team.name} (${team.slug})`);
    console.log('─'.repeat(50));

    // Get responses by week for the last 12 weeks
    const responses = await prisma.pulseResponse.findMany({
      where: {
        tenantId: tenant.id,
        teamId: team.id,
        submittedAt: {
          gte: new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Group by week
    const weeklyScores: Record<string, number[]> = {};
    responses.forEach(r => {
      const weekKey = new Date(r.submittedAt).toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      if (!weeklyScores[weekKey]) weeklyScores[weekKey] = [];
      weeklyScores[weekKey].push(r.score);
    });

    // Calculate averages
    const weeks = Object.keys(weeklyScores).sort();
    if (weeks.length === 0) {
      console.log('  ⚠️ No data found\n');
      continue;
    }

    const firstWeek = weeks[0];
    const lastWeek = weeks[weeks.length - 1];

    const firstAvg =
      weeklyScores[firstWeek].reduce((a, b) => a + b, 0) / weeklyScores[firstWeek].length;
    const lastAvg =
      weeklyScores[lastWeek].reduce((a, b) => a + b, 0) / weeklyScores[lastWeek].length;

    const trend = lastAvg - firstAvg;
    const trendIcon = trend > 0.1 ? '📈 Improving' : trend < -0.1 ? '📉 Declining' : '➡️ Stable';

    console.log(`  Oldest week (${firstWeek}): ${firstAvg.toFixed(2)}`);
    console.log(`  Latest week (${lastWeek}): ${lastAvg.toFixed(2)}`);
    console.log(`  Trend: ${trendIcon} (${trend > 0 ? '+' : ''}${trend.toFixed(2)})`);
    console.log(`  Total responses: ${responses.length}`);

    // Expected trends
    const expected =
      team.slug === 'engineering'
        ? '📈 Improving (should be around +0.6)'
        : '📉 Declining (should be around -0.3)';
    console.log(`  Expected: ${expected}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkTeamTrends()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
