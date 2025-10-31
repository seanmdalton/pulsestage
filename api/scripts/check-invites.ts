import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@demo.pulsestage.dev' },
  });

  if (!admin) {
    console.log('❌ Admin user not found');
    return;
  }

  console.log('✅ Admin user found:', admin.email, admin.id);

  const invites = await prisma.pulseInvite.findMany({
    where: {
      userId: admin.id,
      status: 'PENDING',
    },
    include: {
      question: true,
    },
  });

  console.log(`\n📊 Found ${invites.length} pending invites for admin:`);
  invites.forEach(inv => {
    console.log(`  - Question: "${inv.question.text}"`);
    console.log(`    Token: ${inv.token}`);
    console.log(`    Status: ${inv.status}`);
    console.log(`    Expires: ${inv.expiresAt}`);
  });
}

main().finally(() => prisma.$disconnect());
