import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
  });

  if (!tenant) {
    console.log('❌ Tenant not found');
    return;
  }

  console.log('📊 Pulse Data Summary for tenant:', tenant.name);
  console.log('='.repeat(60));

  // Check responses
  const responses = await prisma.pulseResponse.findMany({
    where: { tenantId: tenant.id },
    include: { question: true },
    orderBy: { submittedAt: 'desc' },
    take: 10,
  });

  console.log(`\n💙 Total Pulse Responses: ${responses.length}`);
  responses.forEach((r, i) => {
    console.log(`  ${i + 1}. Question: "${r.question.text.substring(0, 50)}..."`);
    console.log(`     Score: ${r.score}, Submitted: ${r.submittedAt.toISOString()}`);
    console.log(`     Cohort: ${r.cohortName || 'N/A'}`);
  });

  // Check completed invites
  const completedInvites = await prisma.pulseInvite.findMany({
    where: {
      tenantId: tenant.id,
      status: 'COMPLETED',
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  console.log(`\n✅ Completed Invites: ${completedInvites.length}`);
  completedInvites.forEach((inv, i) => {
    console.log(`  ${i + 1}. Completed: ${inv.completedAt?.toISOString() || 'N/A'}`);
  });

  // Check pending invites
  const pendingInvites = await prisma.pulseInvite.count({
    where: {
      tenantId: tenant.id,
      status: { in: ['PENDING', 'SENT'] },
    },
  });

  console.log(`\n⏳ Pending Invites: ${pendingInvites}`);

  // Check questions
  const questions = await prisma.pulseQuestion.count({
    where: { tenantId: tenant.id, active: true },
  });

  console.log(`\n📝 Active Questions: ${questions}`);
}

main().finally(() => prisma.$disconnect());
