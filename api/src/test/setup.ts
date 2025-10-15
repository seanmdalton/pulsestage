import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { resetMockData } from '../middleware/sessionAuth.js';

// Use a test database - set this BEFORE any imports that might use env
const TEST_DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://app:app@localhost:5432/ama_test';
process.env.DATABASE_URL = TEST_DATABASE_URL;

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // Push schema to test database with force reset for schema changes
  execSync('npx prisma db push --skip-generate --force-reset --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
  await testPrisma.$connect();

  // Apply full-text search migration
  try {
    await testPrisma.$executeRawUnsafe(
      `ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "search_vector" tsvector`
    );

    await testPrisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION question_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW."responseText", '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await testPrisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS question_search_vector_trigger ON "Question"`
    );
    await testPrisma.$executeRawUnsafe(`
      CREATE TRIGGER question_search_vector_trigger
        BEFORE INSERT OR UPDATE OF body, "responseText"
        ON "Question"
        FOR EACH ROW
        EXECUTE FUNCTION question_search_vector_update()
    `);

    await testPrisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Question_search_vector_idx" ON "Question" USING GIN(search_vector)`
    );
  } catch (_error) {
    // Migration might already be applied, continue
    console.log('Full-text search migration skipped (may already exist)');
  }

  // Create default tenant for backward compatibility tests
  await testPrisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      name: 'Default Tenant',
    },
  });
});

beforeEach(async () => {
  // Clean up database before each test (preserve default tenant)
  await testPrisma.auditLog.deleteMany(); // Delete audit logs first
  await testPrisma.questionTag.deleteMany();
  await testPrisma.upvote.deleteMany();
  await testPrisma.question.deleteMany();
  await testPrisma.teamMembership.deleteMany();
  await testPrisma.userPreferences.deleteMany();
  await testPrisma.team.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.tag.deleteMany();
  await testPrisma.tenant.deleteMany({
    where: {
      slug: { not: 'default' },
    },
  });

  // Reset mock SSO data cache so tests can create their own users
  resetMockData();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
