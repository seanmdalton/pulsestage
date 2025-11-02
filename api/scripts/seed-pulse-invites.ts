#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * CLI script to seed pulse invites
 * Thin wrapper around src/seed/pulse-invites.ts
 */

import { seedPulseInvites } from '../src/seed/pulse-invites.js';

async function main() {
  try {
    console.log('Seeding pulse invites...');

    const created = await seedPulseInvites('default', 10);

    if (created > 0) {
      console.log('\nNext steps:');
      console.log('   1. Log in as any user');
      console.log('   2. Navigate to Dashboard');
      console.log('   3. You should see the "Pending Pulse" card with a badge!');
    }
  } catch (error) {
    console.error('[ERROR] Error:', error);
    process.exit(1);
  }
}

main();
