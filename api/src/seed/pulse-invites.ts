/**
 * Seed pulse invites for development and demo environments
 * Creates pending pulse invites for users in a tenant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed pulse invites for a tenant
 * @param tenantSlug - Tenant slug (defaults to 'default')
 * @param userLimit - Maximum number of users to create invites for (defaults to 10)
 */
export async function seedPulseInvites(tenantSlug = 'default', userLimit = 10) {
  console.log(`[SEED] Seeding pulse invites for tenant: ${tenantSlug}`);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    throw new Error(`Tenant '${tenantSlug}' not found`);
  }

  // Get users
  const users = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    take: userLimit,
  });

  if (users.length === 0) {
    console.log(`[WARNING] No users found in tenant '${tenantSlug}'`);
    return 0;
  }

  // Get active questions
  const questions = await prisma.pulseQuestion.findMany({
    where: {
      tenantId: tenant.id,
      active: true,
    },
  });

  if (questions.length === 0) {
    console.log(`[WARNING] No active pulse questions found in tenant '${tenantSlug}'`);
    return 0;
  }

  // Clear existing PENDING invites (keep COMPLETED ones for history)
  await prisma.pulseInvite.deleteMany({
    where: {
      tenantId: tenant.id,
      status: 'PENDING',
    },
  });

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

  console.log(`[OK] Created ${created} pulse invites for tenant '${tenantSlug}'`);
  return created;
}
