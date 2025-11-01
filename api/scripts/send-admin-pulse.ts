#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Send a pulse invite to admin users for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('[SCAN] Finding admin users...');

    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    if (!tenant) {
      throw new Error('Default tenant not found');
    }

    // Find users with admin role (via TeamMembership)
    const adminMemberships = await prisma.teamMembership.findMany({
      where: {
        team: {
          tenantId: tenant.id,
        },
        role: 'admin',
      },
      include: {
        user: true,
      },
      distinct: ['userId'],
      take: 3,
    });

    let adminUsers = adminMemberships.map(m => m.user);

    console.log(
      ` Found ${adminUsers.length} admin users:`,
      adminUsers.map(u => u.email)
    );

    if (adminUsers.length === 0) {
      console.log('[WARNING]  No admin users found. Looking for any users...');

      // Just get any users from this tenant
      adminUsers = await prisma.user.findMany({
        where: {
          tenantId: tenant.id,
        },
        take: 3,
      });

      console.log(
        ` Using ${adminUsers.length} regular users instead:`,
        adminUsers.map(u => u.email)
      );
    }

    // Get an active question
    const question = await prisma.pulseQuestion.findFirst({
      where: {
        tenantId: tenant.id,
        active: true,
      },
    });

    if (!question) {
      throw new Error('No active pulse questions found');
    }

    console.log(` Using question: "${question.text}"`);

    // Send invites to admin users
    const { sendPulseInvitations } = await import('../src/pulse/invitationService.js');

    const result = await sendPulseInvitations(prisma, {
      tenantId: tenant.id,
      questionId: question.id,
      userIds: adminUsers.map(u => u.id),
      expiresInDays: 7,
    });

    console.log('\n[OK] Pulse invitations sent!');
    console.log(`   Sent: ${result.sent}`);
    console.log(`   Failed: ${result.failed}`);

    if (result.sent > 0) {
      console.log('\n📧 Check Mailpit at: http://localhost:8025');
      console.log('   Look for emails to:');
      adminUsers.forEach(u => console.log(`   - ${u.email}`));
    }
  } catch (error) {
    console.error('[ERROR] Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
