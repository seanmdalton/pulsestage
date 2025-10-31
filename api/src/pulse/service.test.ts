/**
 * Weekly Pulse Service Tests
 * Tests anonymity enforcement and tenant isolation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getPulseSummary } from './service.js';

const prisma = new PrismaClient();

describe('Pulse Service', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let question1Id: string;
  let question2Id: string;

  beforeAll(async () => {
    // Use the default tenant created in test setup
    const tenant1 = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (!tenant1) throw new Error('Default tenant not found');
    tenant1Id = tenant1.id;
  });

  beforeEach(async () => {
    // Clean responses and questions
    await prisma.pulseResponse.deleteMany({ where: { tenantId: tenant1Id } });
    if (tenant2Id) {
      await prisma.pulseResponse.deleteMany({ where: { tenantId: tenant2Id } });
      await prisma.pulseQuestion.deleteMany({ where: { tenantId: tenant2Id } });
    }
    await prisma.pulseQuestion.deleteMany({ where: { tenantId: tenant1Id } });

    // Create a second tenant for isolation tests (will be deleted by global beforeEach)
    const tenant2 = await prisma.tenant.create({
      data: { slug: `test-pulse-2-${Date.now()}`, name: 'Test Pulse Tenant 2' },
    });
    tenant2Id = tenant2.id;

    // Recreate questions
    const q1 = await prisma.pulseQuestion.create({
      data: {
        tenantId: tenant1Id,
        text: 'How do you feel?',
        scale: 'LIKERT_1_5',
        active: true,
      },
    });
    question1Id = q1.id;

    const q2 = await prisma.pulseQuestion.create({
      data: {
        tenantId: tenant2Id,
        text: 'How satisfied are you?',
        scale: 'LIKERT_1_5',
        active: true,
      },
    });
    question2Id = q2.id;
  });

  afterAll(async () => {
    // Clean up - database resets between test suites, so we just need to disconnect
    await prisma.$disconnect();
  });

  describe('Anonymity Enforcement', () => {
    it('should hide averages when responses < threshold (default 5)', async () => {
      // Create 3 responses (below threshold) - use dates in past week
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      for (let i = 0; i < 3; i++) {
        await prisma.pulseResponse.create({
          data: {
            tenantId: tenant1Id,
            questionId: question1Id,
            score: 4,
            submittedAt: threeDaysAgo,
          },
        });
      }

      const summary = await getPulseSummary(prisma, {
        tenantId: tenant1Id,
        range: '4w',
      });

      // Should have 5 as threshold (default)
      expect(summary.anonThreshold).toBe(5);

      // Should mark as insufficient
      const question = summary.questions.find(q => q.questionId === question1Id);
      expect(question?.insufficient).toBe(true);
      expect(question?.overallAverage).toBeNull();
    });

    it('should show averages when responses >= threshold', async () => {
      // Create 5 responses (at threshold) - use 7 days ago (1 full week back)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(12, 0, 0, 0);

      for (let i = 0; i < 5; i++) {
        await prisma.pulseResponse.create({
          data: {
            tenantId: tenant1Id,
            questionId: question1Id,
            score: 4,
            submittedAt: oneWeekAgo,
          },
        });
      }

      const summary = await getPulseSummary(prisma, {
        tenantId: tenant1Id,
        range: '4w',
      });

      const question = summary.questions.find(q => q.questionId === question1Id);
      expect(question?.insufficient).toBe(false);
      expect(question?.overallAverage).toBe(4);
    });

    it('should respect custom anonymity threshold', async () => {
      // Create 2 responses - use 7 days ago (1 full week back)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(12, 0, 0, 0);

      for (let i = 0; i < 2; i++) {
        await prisma.pulseResponse.create({
          data: {
            tenantId: tenant1Id,
            questionId: question1Id,
            score: 3,
            submittedAt: oneWeekAgo,
          },
        });
      }

      // With threshold=2, should show data
      const summary = await getPulseSummary(prisma, {
        tenantId: tenant1Id,
        range: '4w',
        anonThreshold: 2,
      });

      expect(summary.anonThreshold).toBe(2);
      const question = summary.questions.find(q => q.questionId === question1Id);
      expect(question?.insufficient).toBe(false);
      expect(question?.overallAverage).toBe(3);
    });
  });

  describe('Tenant Isolation', () => {
    it('should only return data for requested tenant', async () => {
      // Add responses to both tenants - use 7 days ago (1 full week back)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(12, 0, 0, 0);

      await prisma.pulseResponse.create({
        data: {
          tenantId: tenant1Id,
          questionId: question1Id,
          score: 5,
          submittedAt: oneWeekAgo,
        },
      });

      await prisma.pulseResponse.create({
        data: {
          tenantId: tenant2Id,
          questionId: question2Id,
          score: 1,
          submittedAt: oneWeekAgo,
        },
      });

      // Query tenant 1
      const summary1 = await getPulseSummary(prisma, {
        tenantId: tenant1Id,
        range: '4w',
        anonThreshold: 1,
      });

      // Should only see tenant 1 questions
      expect(summary1.questions).toHaveLength(1);
      expect(summary1.questions[0].questionId).toBe(question1Id);
      expect(summary1.questions[0].overallAverage).toBe(5);

      // Query tenant 2
      const summary2 = await getPulseSummary(prisma, {
        tenantId: tenant2Id,
        range: '4w',
        anonThreshold: 1,
      });

      // Should only see tenant 2 questions
      expect(summary2.questions).toHaveLength(1);
      expect(summary2.questions[0].questionId).toBe(question2Id);
      expect(summary2.questions[0].overallAverage).toBe(1);
    });
  });

  describe('Aggregation', () => {
    it('should calculate correct averages', async () => {
      // Create responses with known scores - use 7 days ago (1 full week back)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(12, 0, 0, 0);

      const scores = [1, 2, 3, 4, 5];
      for (const score of scores) {
        await prisma.pulseResponse.create({
          data: {
            tenantId: tenant1Id,
            questionId: question1Id,
            score,
            submittedAt: oneWeekAgo,
          },
        });
      }

      const summary = await getPulseSummary(prisma, {
        tenantId: tenant1Id,
        range: '4w',
      });

      const question = summary.questions.find(q => q.questionId === question1Id);
      // Average of 1,2,3,4,5 = 3
      expect(question?.overallAverage).toBe(3);
    });
  });
});
