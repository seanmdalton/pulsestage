#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Seed pulse invites for development testing
 * Creates pending pulse invites for all users in the default tenant
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    console.log('🌱 Seeding pulse invites...');
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
    });
    if (!tenant) {
      throw new Error('Default tenant not found');
    }
    // Get all users
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      take: 10, // Limit to first 10 users
    });
    if (users.length === 0) {
      console.log('[WARNING]  No users found in default tenant');
      return;
    }
    console.log(` Found ${users.length} users`);
    // Get active questions
    const questions = await prisma.pulseQuestion.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
      },
      take: 3, // Use first 3 questions
    });
    if (questions.length === 0) {
      console.log('[WARNING]  No active pulse questions found');
      return;
    }
    console.log(` Found ${questions.length} active questions`);
    // Clear existing PENDING invites (keep COMPLETED ones for history)
    const deletedCount = await prisma.pulseInvite.deleteMany({
      where: {
        tenantId: tenant.id,
        status: 'PENDING',
      },
    });
    console.log(`🗑  Cleared ${deletedCount.count} existing pending invites`);
    // Create new invites - 1 question per user
    let created = 0;
    for (const user of users) {
      // Pick a random question
      const question = questions[Math.floor(Math.random() * questions.length)];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
      await prisma.pulseInvite.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          questionId: question.id,
          status: 'PENDING',
          channel: 'EMAIL',
          expiresAt,
          token: `dev-token-${user.id.substring(0, 8)}-${Date.now()}`,
        },
      });
      created++;
    }
    console.log(`\n[OK] Created ${created} pulse invites!`);
    console.log('\n📧 Users with pending invites:');
    for (const user of users) {
      console.log(`   - ${user.email}`);
    }
    console.log('\n🎯 Next steps:');
    console.log('   1. Log in as any of these users');
    console.log('   2. Navigate to Dashboard');
    console.log('   3. You should see the "Pending Pulse" card with a badge!');
  } catch (error) {
    console.error('[ERROR] Error:', error);
    throw error; // Re-throw for caller to handle
  } finally {
    await prisma.$disconnect();
  }
}
// Export for use in API endpoints
export async function seedPulseInvites() {
  await main();
}
// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => {
    console.error('[ERROR] Fatal error:', e);
    process.exit(1);
  });
}
