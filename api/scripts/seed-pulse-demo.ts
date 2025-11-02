#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * CLI script to seed comprehensive Pulse demo data
 * Thin wrapper around src/seed-pulse-data.ts
 */

async function main() {
  try {
    console.log('Seeding comprehensive Pulse demo data...');
    await seedPulseData('default');

    console.log('\nNext steps:');
    console.log('   1. Refresh the Pulse Dashboard: http://localhost:5173/pulse/dashboard');
    console.log('   2. You should see 12 weeks of historical data');
  } catch (error) {
    console.error('[ERROR] Error:', error);
    process.exit(1);
  }
}

main();
