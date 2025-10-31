#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Quick script to trigger a pulse send for testing
 * Usage: tsx scripts/trigger-pulse.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Triggering pulse send...');

    // Import the manual trigger function
    const { manualTriggerPulseSend } = await import('../src/pulse/scheduler.js');

    // Trigger for cohort_a (or all cohorts if not specified)
    const result = await manualTriggerPulseSend(prisma, undefined, 'cohort_a');

    console.log('✅ Pulse send complete!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    console.log('\n📧 Check Mailpit at: http://localhost:8025');
  } catch (error) {
    console.error('❌ Error triggering pulse:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
