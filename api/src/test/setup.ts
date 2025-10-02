import { beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

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
  // Push schema to test database
  execSync("npx prisma db push --skip-generate", { 
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
  });
  await testPrisma.$connect();
});

beforeEach(async () => {
  // Clean up database before each test
  await testPrisma.questionTag.deleteMany();
  await testPrisma.question.deleteMany();
  await testPrisma.team.deleteMany();
  await testPrisma.tag.deleteMany();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

