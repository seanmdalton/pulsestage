#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Enable and configure Pulse for testing
 * Usage: tsx scripts/enable-pulse.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('⚙️  Enabling Pulse...');

    // Get default tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
      include: { settings: true },
    });

    if (!tenant) {
      throw new Error('Default tenant not found');
    }

    // Update settings to enable Pulse
    const currentSettings = (tenant.settings?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      pulse: {
        enabled: true,
        anonThreshold: 5,
        defaultCadence: 'weekly',
        defaultTime: '09:00',
        rotatingCohorts: true,
        channelSlack: false,
        channelEmail: true,
      },
    };

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        settings: updatedSettings,
      },
      update: {
        settings: updatedSettings,
      },
    });

    console.log('✅ Pulse enabled!');

    // Create a schedule
    console.log('📅 Creating schedule...');

    const _schedule = await prisma.pulseSchedule.upsert({
      where: {
        tenantId: tenant.id,
      },
      create: {
        tenantId: tenant.id,
        cadence: 'WEEKLY',
        dayOfWeek: 1, // Monday
        timeOfDay: '09:00',
        rotatingCohorts: true,
        enabled: true,
      },
      update: {
        enabled: true,
      },
    });

    console.log('✅ Schedule created!');

    // Check if we have questions
    const questionCount = await prisma.pulseQuestion.count({
      where: { tenantId: tenant.id, active: true },
    });

    console.log(`📝 Active questions: ${questionCount}`);

    if (questionCount === 0) {
      console.log('⚠️  No active questions found. Creating default questions...');

      const questions = [
        { text: 'How recognized do you feel this week?', category: 'recognition' },
        { text: 'How aligned do you feel with team goals?', category: 'alignment' },
        { text: 'How is your workload this week?', category: 'wellbeing' },
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

      console.log(`✅ Created ${questions.length} questions!`);
    }

    console.log('\n🎯 Pulse is now configured!');
    console.log('   Run: tsx scripts/trigger-pulse.ts');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
