import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTeams = [
  {
    id: 'general',
    name: 'General',
    slug: 'general',
    description: 'General organizational questions'
  },
  {
    id: 'engineering',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Technical and development questions'
  },
  {
    id: 'product',
    name: 'Product',
    slug: 'product',
    description: 'Product strategy and feature questions'
  },
  {
    id: 'people',
    name: 'People',
    slug: 'people',
    description: 'HR, culture, and people-related questions'
  }
];

async function seedTeams() {
  console.log('🌱 Seeding default teams...');

  for (const team of defaultTeams) {
    const existingTeam = await prisma.team.findUnique({
      where: { slug: team.slug }
    });

    if (!existingTeam) {
      await prisma.team.create({
        data: team
      });
      console.log(`✅ Created team: ${team.name}`);
    } else {
      console.log(`⏭️  Team already exists: ${team.name}`);
    }
  }

  // Assign existing questions without teamId to General team
  const unassignedQuestions = await prisma.question.findMany({
    where: { teamId: null }
  });

  if (unassignedQuestions.length > 0) {
    await prisma.question.updateMany({
      where: { teamId: null },
      data: { teamId: 'general' }
    });
    console.log(`✅ Assigned ${unassignedQuestions.length} existing questions to General team`);
  }

  console.log('🎉 Team seeding completed!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTeams()
    .catch((error) => {
      console.error('❌ Error seeding teams:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedTeams };
