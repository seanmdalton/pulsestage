import { beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { resetMockData } from "../middleware/mockAuth.js";

// Use a test database - set this BEFORE any imports that might use env
const TEST_DATABASE_URL = process.env.DATABASE_URL || "postgresql://app:app@localhost:5432/ama_test";
process.env.DATABASE_URL = TEST_DATABASE_URL;

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL
    }
  }
});

beforeAll(async () => {
  // Push schema to test database with force reset for schema changes
  execSync("npx prisma db push --skip-generate --force-reset --accept-data-loss", { 
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
  });
  await testPrisma.$connect();
  
  // Create default tenant for backward compatibility tests
  await testPrisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      id: 'default-tenant-id',
      slug: 'default',
      name: 'Default Tenant'
    }
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
      slug: { not: 'default' }
    }
  });
  
  // Reset mock SSO data cache so tests can create their own users
  resetMockData();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

