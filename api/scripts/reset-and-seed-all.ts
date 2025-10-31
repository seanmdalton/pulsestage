#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Complete database reset and seed script
 * This will give you a clean, fully-featured demo environment
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Complete Database Reset & Seed');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Push schema (will reset if needed)
    console.log('1️⃣  Pushing database schema...');
    execSync('npx prisma db push --force-reset --accept-data-loss', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Schema pushed\n');

    // Step 2: Seed base data (teams and tags only)
    console.log('2️⃣  Seeding base data (teams and tags)...');
    const { seedTeams } = await import('../src/seed-teams.js');
    const { seedTags } = await import('../src/seed-tags.js');

    await seedTeams();
    await seedTags();

    // Get tenant for next steps
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    if (!tenant) {
      throw new Error('Default tenant not found after seeding teams');
    }

    console.log('✅ Base data seeded (teams and tags)\n');

    // Step 3: Enable Pulse
    console.log('3️⃣  Enabling and configuring Pulse...');

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        settings: {
          pulse: {
            enabled: true,
            anonThreshold: 5,
            defaultCadence: 'weekly',
            defaultTime: '09:00',
            rotatingCohorts: true,
            channelSlack: false,
            channelEmail: true,
          },
        },
      },
      update: {
        settings: {
          pulse: {
            enabled: true,
            anonThreshold: 5,
            defaultCadence: 'weekly',
            defaultTime: '09:00',
            rotatingCohorts: true,
            channelSlack: false,
            channelEmail: true,
          },
        },
      },
    });

    // Create pulse schedule
    await prisma.pulseSchedule.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        cadence: 'WEEKLY',
        dayOfWeek: 1,
        timeOfDay: '09:00',
        rotatingCohorts: true,
        enabled: true,
      },
      update: {
        enabled: true,
      },
    });

    // Create pulse questions if they don't exist
    const existingQuestions = await prisma.pulseQuestion.count({
      where: { tenantId: tenant.id },
    });

    if (existingQuestions === 0) {
      const questions = [
        {
          text: 'How recognized do you feel for your contributions this week?',
          category: 'recognition',
        },
        { text: 'How aligned do you feel with team goals and priorities?', category: 'alignment' },
        { text: 'How supported do you feel by your manager/team?', category: 'support' },
        { text: 'How would you rate your work-life balance this week?', category: 'wellbeing' },
        {
          text: 'How confident are you in the direction of the organization?',
          category: 'confidence',
        },
        { text: 'How empowered do you feel to make decisions?', category: 'autonomy' },
        { text: 'How satisfied are you with your professional growth?', category: 'growth' },
        { text: "How clear are you on what's expected of you?", category: 'clarity' },
        { text: 'How well do you feel your contributions are valued?', category: 'recognition' },
        { text: 'How would you rate team collaboration this week?', category: 'collaboration' },
      ];

      for (const q of questions) {
        await prisma.pulseQuestion.create({
          data: {
            tenantId: tenant.id,
            text: q.text,
            category: q.category,
            scale: 'LIKERT_1_5',
            active: true,
          },
        });
      }
    }

    console.log('✅ Pulse enabled\n');

    // Step 4: Seed Q&A questions and users
    console.log('4️⃣  Seeding Q&A questions and demo data...');
    const { seedDemoData } = await import('../src/seed-demo-data.js');
    await seedDemoData(prisma, tenant.id);
    console.log('✅ Q&A questions seeded\n');

    // Step 5: Create demo pulse cohorts (after users are created)
    console.log('5️⃣  Creating pulse cohorts...');
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, email: true, name: true },
    });

    if (users.length > 0) {
      // Create 2 cohorts: weekday and weekend
      const weekdayUsers = users.filter((_, i) => i % 2 === 0);
      const weekendUsers = users.filter((_, i) => i % 2 === 1);

      await prisma.pulseCohort.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: 'Weekday Team',
          },
        },
        create: {
          tenantId: tenant.id,
          name: 'Weekday Team',
          userIds: weekdayUsers.map(u => u.id),
        },
        update: {
          userIds: weekdayUsers.map(u => u.id),
        },
      });

      await prisma.pulseCohort.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: 'Weekend Team',
          },
        },
        create: {
          tenantId: tenant.id,
          name: 'Weekend Team',
          userIds: weekendUsers.map(u => u.id),
        },
        update: {
          userIds: weekendUsers.map(u => u.id),
        },
      });

      console.log(
        `✅ Created 2 pulse cohorts (Weekday: ${weekdayUsers.length}, Weekend: ${weekendUsers.length})\n`
      );
    } else {
      console.log('⚠️  No users found, skipping cohort creation\n');
    }

    // Step 6: Seed 8 weeks of pulse demo data
    console.log('6️⃣  Seeding 8 weeks of pulse demo data...');
    execSync('npx tsx scripts/seed-pulse-demo.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Pulse demo data seeded\n');

    // Step 7: Seed pending invites for user dashboard testing
    console.log('7️⃣  Seeding pending pulse invites...');
    execSync('npx tsx scripts/seed-pulse-invites.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Pending invites seeded\n');

    console.log('='.repeat(60));
    console.log('🎉 Complete! Your demo environment is ready!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 What you can test now:');
    console.log('');
    console.log('1. User Dashboard (with pending pulse):');
    console.log('   http://localhost:5173/all/dashboard');
    console.log('   - Login as: admin@pulsestage.app');
    console.log('   - See "Weekly Pulse" card with badge');
    console.log('   - See "Your Activity" and "Pulse History"');
    console.log('');
    console.log('2. Pulse Dashboard (team analytics):');
    console.log('   http://localhost:5173/pulse/dashboard');
    console.log('   - 8 weeks of historical data');
    console.log('   - Question breakdowns with charts');
    console.log('   - Participation rates and trends');
    console.log('');
    console.log('3. Questions & Answers:');
    console.log('   http://localhost:5173/all/questions');
    console.log('   - Browse open/answered questions');
    console.log('   - Filter by team');
    console.log('   - Upvote and submit new questions');
    console.log('');
    console.log('4. Admin Panel:');
    console.log('   http://localhost:5173/admin');
    console.log('   - Manage teams, users, tags');
    console.log('   - Configure pulse settings');
    console.log('   - Theme customization');
    console.log('');

    // Step 8: Validate seed data
    console.log('8️⃣  Validating seed data...');
    execSync('npx tsx scripts/test-seed-data.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
