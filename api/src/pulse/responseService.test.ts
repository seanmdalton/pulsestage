/**
 * Pulse Response Service Tests
 * Tests token validation, expiration, and response submission
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, PulseChannel, PulseInviteStatus } from '@prisma/client';
import { submitPulseResponse, getPulseInviteStatus } from './responseService.js';

const prisma = new PrismaClient();

describe('Pulse Response Service', () => {
  let tenantId: string;
  let questionId: string;
  let userId: string;
  let validToken: string;
  let expiredToken: string;
  let completedToken: string;
  let npsQuestionId: string;

  beforeAll(async () => {
    // Use the default tenant created in test setup
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (!tenant) throw new Error('Default tenant not found');
    tenantId = tenant.id;
  });

  beforeEach(async () => {
    // Clean and recreate test data before each test
    await prisma.pulseResponse.deleteMany({ where: { tenantId } });
    await prisma.pulseInvite.deleteMany({ where: { tenantId } });
    await prisma.pulseQuestion.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });

    // Create test question
    const question = await prisma.pulseQuestion.create({
      data: {
        tenantId,
        text: 'How do you feel?',
        scale: 'LIKERT_1_5',
        active: true,
      },
    });
    questionId = question.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: 'test-pulse@example.com',
        name: 'Test User',
      },
    });
    userId = user.id;

    // Create valid invite
    const validInvite = await prisma.pulseInvite.create({
      data: {
        tenantId,
        userId,
        questionId,
        channel: PulseChannel.EMAIL,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: PulseInviteStatus.PENDING,
        token: `valid-token-${Date.now()}`,
      },
    });
    validToken = validInvite.token;

    // Create expired invite
    const expiredInvite = await prisma.pulseInvite.create({
      data: {
        tenantId,
        userId,
        questionId,
        channel: PulseChannel.EMAIL,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        status: PulseInviteStatus.PENDING,
        token: `expired-token-${Date.now()}`,
      },
    });
    expiredToken = expiredInvite.token;

    // Create completed invite
    const completedInvite = await prisma.pulseInvite.create({
      data: {
        tenantId,
        userId,
        questionId,
        channel: PulseChannel.EMAIL,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: PulseInviteStatus.COMPLETED,
        completedAt: new Date(),
        token: `completed-token-${Date.now()}`,
      },
    });
    completedToken = completedInvite.token;

    // Create NPS question for NPS scale tests
    const npsQuestion = await prisma.pulseQuestion.create({
      data: {
        tenantId,
        text: 'How likely are you to recommend us?',
        scale: 'NPS_0_10',
        active: true,
      },
    });
    npsQuestionId = npsQuestion.id;
  });

  afterAll(async () => {
    // Clean up - database resets between test suites, so we just need to disconnect
    await prisma.$disconnect();
  });

  describe('submitPulseResponse', () => {
    it('should successfully submit response with valid token', async () => {
      const result = await submitPulseResponse(prisma, {
        token: validToken,
        score: 4,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Thank you');

      // Verify response was created
      const responses = await prisma.pulseResponse.findMany({
        where: { questionId },
      });
      expect(responses.length).toBe(1);
      expect(responses[0].score).toBe(4);
      expect(responses[0].questionId).toBe(questionId);
      // Verify no userId (anonymous)
      expect((responses[0] as any).userId).toBeUndefined();

      // Verify invite was marked as completed
      const invite = await prisma.pulseInvite.findUnique({
        where: { token: validToken },
      });
      expect(invite?.status).toBe(PulseInviteStatus.COMPLETED);
      expect(invite?.completedAt).not.toBeNull();
    });

    it('should reject invalid token', async () => {
      const result = await submitPulseResponse(prisma, {
        token: 'invalid-token-12345',
        score: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_TOKEN');
    });

    it('should reject expired token', async () => {
      const result = await submitPulseResponse(prisma, {
        token: expiredToken,
        score: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('EXPIRED');
    });

    it('should reject already completed token', async () => {
      const result = await submitPulseResponse(prisma, {
        token: completedToken,
        score: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_COMPLETED');
    });

    it('should reject invalid score (too low)', async () => {
      // Create a fresh invite for this test
      const invite = await prisma.pulseInvite.create({
        data: {
          tenantId,
          userId,
          questionId,
          channel: PulseChannel.EMAIL,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: PulseInviteStatus.PENDING,
        },
      });

      const result = await submitPulseResponse(prisma, {
        token: invite.token,
        score: 0, // Likert scale is 1-5
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_SCORE');
    });

    it('should reject invalid score (too high)', async () => {
      // Create a fresh invite for this test
      const invite = await prisma.pulseInvite.create({
        data: {
          tenantId,
          userId,
          questionId,
          channel: PulseChannel.EMAIL,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: PulseInviteStatus.PENDING,
        },
      });

      const result = await submitPulseResponse(prisma, {
        token: invite.token,
        score: 6, // Likert scale is 1-5
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_SCORE');
    });

    it('should accept optional comment', async () => {
      // Create a fresh invite for this test
      const invite = await prisma.pulseInvite.create({
        data: {
          tenantId,
          userId,
          questionId,
          channel: PulseChannel.EMAIL,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: PulseInviteStatus.PENDING,
        },
      });

      const result = await submitPulseResponse(prisma, {
        token: invite.token,
        score: 3,
        comment: 'Could be better',
      });

      expect(result.success).toBe(true);

      // Verify comment was saved
      const response = await prisma.pulseResponse.findFirst({
        where: { questionId, comment: 'Could be better' },
      });
      expect(response).not.toBeNull();
      expect(response?.comment).toBe('Could be better');
    });
  });

  describe('getPulseInviteStatus', () => {
    it('should return status for valid token', async () => {
      // Create a fresh invite
      const invite = await prisma.pulseInvite.create({
        data: {
          tenantId,
          userId,
          questionId,
          channel: PulseChannel.EMAIL,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: PulseInviteStatus.PENDING,
        },
      });

      const status = await getPulseInviteStatus(prisma, invite.token);

      expect(status.valid).toBe(true);
      expect(status.questionText).toBe('How do you feel?');
      expect(status.scale).toBe('LIKERT_1_5');
      expect(status.expired).toBe(false);
      expect(status.alreadyCompleted).toBe(false);
    });

    it('should detect expired invites', async () => {
      const status = await getPulseInviteStatus(prisma, expiredToken);

      expect(status.valid).toBe(true);
      expect(status.expired).toBe(true);
    });

    it('should detect completed invites', async () => {
      const status = await getPulseInviteStatus(prisma, completedToken);

      expect(status.valid).toBe(true);
      expect(status.alreadyCompleted).toBe(true);
    });

    it('should return invalid for non-existent token', async () => {
      const status = await getPulseInviteStatus(prisma, 'non-existent-token-123');

      expect(status.valid).toBe(false);
    });
  });

  describe('NPS Scale Validation', () => {
    it('should accept valid NPS scores (0-10)', async () => {
      for (let score = 0; score <= 10; score++) {
        const invite = await prisma.pulseInvite.create({
          data: {
            tenantId,
            userId,
            questionId: npsQuestionId,
            channel: PulseChannel.EMAIL,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: PulseInviteStatus.PENDING,
          },
        });

        const result = await submitPulseResponse(prisma, {
          token: invite.token,
          score,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid NPS scores', async () => {
      const invite = await prisma.pulseInvite.create({
        data: {
          tenantId,
          userId,
          questionId: npsQuestionId,
          channel: PulseChannel.EMAIL,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: PulseInviteStatus.PENDING,
        },
      });

      const result = await submitPulseResponse(prisma, {
        token: invite.token,
        score: 11, // Invalid for 0-10 scale
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_SCORE');
    });
  });
});
