import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTeams = [
  {
    id: 'general',
    name: 'General',
    slug: 'general',
    description: 'General organizational questions',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Technical and development questions',
  },
  {
    id: 'product',
    name: 'Product',
    slug: 'product',
    description: 'Product strategy and feature questions',
  },
  {
    id: 'people',
    name: 'People',
    slug: 'people',
    description: 'HR, culture, and people-related questions',
  },
];

async function seedTeams() {
  console.log('🌱 Seeding default teams...');

  // Ensure default tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      id: 'default-tenant-id',
      slug: 'default',
      name: 'Default Tenant',
    },
  });
  console.log(`✅ Default tenant: ${tenant.name}`);

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
      console.log(`✅ Created team: ${team.name}`);
    } else {
      console.log(`⏭️  Team already exists: ${team.name}`);
    }
  }

  // Assign existing questions without teamId to General team
  const generalTeam = await prisma.team.findUnique({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: 'general',
      },
    },
  });

  if (generalTeam) {
    const unassignedQuestions = await prisma.question.findMany({
      where: {
        tenantId: tenant.id,
        teamId: null,
      },
    });

    if (unassignedQuestions.length > 0) {
      await prisma.question.updateMany({
        where: {
          tenantId: tenant.id,
          teamId: null,
        },
        data: { teamId: generalTeam.id },
      });
      console.log(`✅ Assigned ${unassignedQuestions.length} existing questions to General team`);
    }
  }

  console.log('🎉 Team seeding completed!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTeams()
    .catch(error => {
      console.error('❌ Error seeding teams:', error);
      throw e;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedTeams };
