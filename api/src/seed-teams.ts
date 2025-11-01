import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTeams = [
  {
    name: 'Engineering',
    slug: 'engineering',
    description: 'Technical development, infrastructure, and engineering culture',
  },
  {
    name: 'Product',
    slug: 'product',
    description: 'Product strategy, roadmap, and feature prioritization',
  },
];

async function seedTeams() {
  console.log('🌱 Seeding default teams...');

  // Ensure default tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      name: 'Default Organization',
    },
  });
  console.log(`[OK] Default tenant: ${tenant.name}`);

  for (const team of defaultTeams) {
    const existingTeam = await prisma.team.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: team.slug,
        },
      },
    });

    if (!existingTeam) {
      await prisma.team.create({
        data: {
          ...team,
          tenantId: tenant.id,
        },
      });
      console.log(`[OK] Created team: ${team.name}`);
    } else {
      console.log(`⏭  Team already exists: ${team.name}`);
    }
  }

  console.log(' Team seeding completed!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTeams()
    .catch(error => {
      console.error('[ERROR] Error seeding teams:', error);
      throw error;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedTeams };
