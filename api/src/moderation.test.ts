import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { testPrisma } from './test/setup.js';
import { type Question, type Team, type Tag, type User } from '@prisma/client';
import type { Express } from 'express';

let app: Express;
let adminUser: User;
let moderatorUser: User;
let memberUser: User;
let team: Team;
let tag1: Tag;
let _tag2: Tag;
let question1: Question;
let question2: Question;
let question3: Question;

beforeAll(async () => {
  app = createApp(testPrisma);
});

afterEach(async () => {
  // Clean up after each test
  await testPrisma.auditLog.deleteMany();
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
});

describe('Moderation Features', () => {
  beforeEach(async () => {
    // Create test data
    const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });
    if (!defaultTenant) throw new Error('Default tenant not found');

    team = await testPrisma.team.create({
      data: {
        tenantId: defaultTenant.id,
        name: 'Engineering',
        slug: 'engineering',
        description: 'Engineering team',
      },
    });

    adminUser = await testPrisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        ssoId: 'admin-sso',
        tenantId: defaultTenant.id,
      },
    });
    moderatorUser = await testPrisma.user.create({
      data: {
        email: 'moderator@example.com',
        name: 'Moderator User',
        ssoId: 'moderator-sso',
        tenantId: defaultTenant.id,
      },
    });
    memberUser = await testPrisma.user.create({
      data: {
        email: 'member@example.com',
        name: 'Member User',
        ssoId: 'member-sso',
        tenantId: defaultTenant.id,
      },
    });

    await testPrisma.teamMembership.createMany({
      data: [
        { userId: adminUser.id, teamId: team.id, role: 'admin' },
        { userId: moderatorUser.id, teamId: team.id, role: 'moderator' },
        { userId: memberUser.id, teamId: team.id, role: 'member' },
      ],
    });

    tag1 = await testPrisma.tag.create({
      data: { tenantId: defaultTenant.id, name: 'Important', color: '#FF0000' },
    });
    _tag2 = await testPrisma.tag.create({
      data: { tenantId: defaultTenant.id, name: 'Urgent', color: '#FFA500' },
    });

    question1 = await testPrisma.question.create({
      data: {
        tenantId: defaultTenant.id,
        body: 'What is our remote work policy?',
        status: 'OPEN',
        upvotes: 10,
        teamId: team.id,
      },
    });
    question2 = await testPrisma.question.create({
      data: {
        tenantId: defaultTenant.id,
        body: 'When is the next all-hands?',
        status: 'OPEN',
        upvotes: 5,
        teamId: team.id,
      },
    });
    question3 = await testPrisma.question.create({
      data: {
        tenantId: defaultTenant.id,
        body: 'How can we improve work-life balance?',
        status: 'ANSWERED',
        responseText: 'We are exploring flexible schedules.',
        upvotes: 20,
        teamId: team.id,
        reviewedBy: moderatorUser.id,
        reviewedAt: new Date(),
      },
    });
  });

  describe('POST /questions/:id/pin', () => {
    it('should allow moderator to pin a question', async () => {
      const response = await request(app)
        .post(`/questions/${question1.id}/pin`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.isPinned).toBe(true);
      expect(response.body.pinnedBy).toBe(moderatorUser.id);
      expect(response.body.pinnedAt).toBeDefined();

      // Verify in database
      const updated = await testPrisma.question.findUnique({ where: { id: question1.id } });
      expect(updated?.isPinned).toBe(true);
      expect(updated?.pinnedBy).toBe(moderatorUser.id);
    });

    it('should allow unpinning a pinned question', async () => {
      // First pin it
      await testPrisma.question.update({
        where: { id: question1.id },
        data: { isPinned: true, pinnedBy: moderatorUser.id, pinnedAt: new Date() },
      });

      // Then unpin
      const response = await request(app)
        .post(`/questions/${question1.id}/pin`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.isPinned).toBe(false);
      expect(response.body.pinnedBy).toBeNull();
      expect(response.body.pinnedAt).toBeNull();
    });

    it('should deny member from pinning', async () => {
      const response = await request(app)
        .post(`/questions/${question1.id}/pin`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'member@example.com');

      expect(response.status).toBe(403);
    });

    it('should create audit log for pin action', async () => {
      const response = await request(app)
        .post(`/questions/${question1.id}/pin`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);

      // Wait a moment for audit log to be written
      await new Promise(resolve => setTimeout(resolve, 100));

      const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });
      const auditLogs = await testPrisma.auditLog.findMany({
        where: {
          action: 'question.pin',
          tenantId: defaultTenant!.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].userId).toBe(moderatorUser.id);
      expect(auditLogs[0].entityId).toBe(question1.id);
    });
  });

  describe('POST /questions/:id/freeze', () => {
    it('should allow moderator to freeze a question', async () => {
      const response = await request(app)
        .post(`/questions/${question1.id}/freeze`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.isFrozen).toBe(true);
      expect(response.body.frozenBy).toBe(moderatorUser.id);
      expect(response.body.frozenAt).toBeDefined();
    });

    it('should allow unfreezing a frozen question', async () => {
      // First freeze it
      await testPrisma.question.update({
        where: { id: question1.id },
        data: { isFrozen: true, frozenBy: moderatorUser.id, frozenAt: new Date() },
      });

      // Then unfreeze
      const response = await request(app)
        .post(`/questions/${question1.id}/freeze`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.isFrozen).toBe(false);
      expect(response.body.frozenBy).toBeNull();
    });

    it('should create audit log for freeze action', async () => {
      const response = await request(app)
        .post(`/questions/${question1.id}/freeze`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      await new Promise(resolve => setTimeout(resolve, 100));

      const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });
      const auditLogs = await testPrisma.auditLog.findMany({
        where: {
          action: 'question.freeze',
          tenantId: defaultTenant!.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].entityId).toBe(question1.id);
    });
  });

  describe('POST /admin/bulk-tag', () => {
    it('should add tags to multiple questions', async () => {
      const response = await request(app)
        .post('/admin/bulk-tag')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          tagId: tag1.id,
          action: 'add',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(2);
      expect(response.body.errorCount).toBe(0);
      expect(response.body.total).toBe(2);

      // Verify tags were added
      const q1Tags = await testPrisma.questionTag.findMany({
        where: { questionId: question1.id },
      });
      const q2Tags = await testPrisma.questionTag.findMany({
        where: { questionId: question2.id },
      });

      expect(q1Tags.some(qt => qt.tagId === tag1.id)).toBe(true);
      expect(q2Tags.some(qt => qt.tagId === tag1.id)).toBe(true);
    });

    it('should remove tags from multiple questions', async () => {
      // First add tags
      await testPrisma.questionTag.createMany({
        data: [
          { questionId: question1.id, tagId: tag1.id },
          { questionId: question2.id, tagId: tag1.id },
        ],
      });

      const response = await request(app)
        .post('/admin/bulk-tag')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          tagId: tag1.id,
          action: 'remove',
        });

      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(2);

      // Verify tags were removed
      const q1Tags = await testPrisma.questionTag.findMany({
        where: { questionId: question1.id },
      });

      expect(q1Tags.length).toBe(0);
    });

    it('should deny members from bulk tagging', async () => {
      const response = await request(app)
        .post('/admin/bulk-tag')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'member@example.com')
        .send({
          questionIds: [question1.id],
          tagId: tag1.id,
          action: 'add',
        });

      expect(response.status).toBe(403);
    });

    it('should create audit log for bulk tag operation', async () => {
      const response = await request(app)
        .post('/admin/bulk-tag')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          tagId: tag1.id,
          action: 'add',
        });

      expect(response.status).toBe(200);
      await new Promise(resolve => setTimeout(resolve, 100));

      const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });
      const auditLogs = await testPrisma.auditLog.findMany({
        where: {
          action: 'bulk.tag.add',
          tenantId: defaultTenant!.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].metadata).toMatchObject({
        tagId: tag1.id,
        successCount: 2,
      });
    });
  });

  describe('POST /admin/bulk-action', () => {
    it('should bulk pin multiple questions', async () => {
      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          action: 'pin',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.successCount).toBe(2);

      // Verify questions were pinned
      const q1 = await testPrisma.question.findUnique({ where: { id: question1.id } });
      const q2 = await testPrisma.question.findUnique({ where: { id: question2.id } });

      expect(q1?.isPinned).toBe(true);
      expect(q2?.isPinned).toBe(true);
      expect(q1?.pinnedBy).toBe(adminUser.id);
    });

    it('should bulk freeze multiple questions', async () => {
      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          action: 'freeze',
        });

      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(2);

      // Verify questions were frozen
      const q1 = await testPrisma.question.findUnique({ where: { id: question1.id } });
      const q2 = await testPrisma.question.findUnique({ where: { id: question2.id } });

      expect(q1?.isFrozen).toBe(true);
      expect(q2?.isFrozen).toBe(true);
    });

    it('should bulk unpin questions', async () => {
      // First pin them
      await testPrisma.question.updateMany({
        where: { id: { in: [question1.id, question2.id] } },
        data: { isPinned: true, pinnedBy: adminUser.id, pinnedAt: new Date() },
      });

      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          action: 'unpin',
        });

      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(2);

      // Verify questions were unpinned
      const q1 = await testPrisma.question.findUnique({ where: { id: question1.id } });
      expect(q1?.isPinned).toBe(false);
    });

    it('should bulk delete questions', async () => {
      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          action: 'delete',
        });

      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(2);

      // Verify questions were deleted
      const q1 = await testPrisma.question.findUnique({ where: { id: question1.id } });
      const q2 = await testPrisma.question.findUnique({ where: { id: question2.id } });

      expect(q1).toBeNull();
      expect(q2).toBeNull();
    });

    it('should deny non-admin from bulk actions', async () => {
      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'member@example.com')
        .send({
          questionIds: [question1.id],
          action: 'pin',
        });

      expect(response.status).toBe(403);
    });

    it('should create audit log for bulk action', async () => {
      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com')
        .send({
          questionIds: [question1.id, question2.id],
          action: 'pin',
        });

      expect(response.status).toBe(200);
      await new Promise(resolve => setTimeout(resolve, 100));

      const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });
      const auditLogs = await testPrisma.auditLog.findMany({
        where: {
          action: 'bulk.pin',
          tenantId: defaultTenant!.id,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].metadata).toMatchObject({
        successCount: 2,
      });
    });
  });

  describe('GET /admin/moderation-queue', () => {
    it('should return all questions by default', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions).toBeDefined();
      expect(response.body.total).toBe(3); // All 3 questions
      expect(response.body.questions.length).toBeLessThanOrEqual(100); // Default limit
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue?status=open')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.length).toBe(2); // Only question1 and question2
      expect(response.body.questions.every((q: any) => q.status === 'OPEN')).toBe(true);
    });

    it('should filter by team', async () => {
      const response = await request(app)
        .get(`/admin/moderation-queue?teamId=${team.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.every((q: any) => q.teamId === team.id)).toBe(true);
    });

    it('should filter by pinned status', async () => {
      // Pin question1
      await testPrisma.question.update({
        where: { id: question1.id },
        data: { isPinned: true, pinnedBy: moderatorUser.id, pinnedAt: new Date() },
      });

      const response = await request(app)
        .get('/admin/moderation-queue?isPinned=true')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.length).toBe(1);
      expect(response.body.questions[0].id).toBe(question1.id);
      expect(response.body.questions[0].isPinned).toBe(true);
    });

    it('should filter by frozen status', async () => {
      // Freeze question2
      await testPrisma.question.update({
        where: { id: question2.id },
        data: { isFrozen: true, frozenBy: moderatorUser.id, frozenAt: new Date() },
      });

      const response = await request(app)
        .get('/admin/moderation-queue?isFrozen=true')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.length).toBe(1);
      expect(response.body.questions[0].isFrozen).toBe(true);
    });

    it('should filter by needsReview', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue?needsReview=true')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.length).toBe(2); // question1 and question2 (not reviewed)
      expect(response.body.questions.every((q: any) => !q.reviewedBy)).toBe(true);
      expect(response.body.questions.every((q: any) => q.status === 'OPEN')).toBe(true);
    });

    it('should filter by reviewedBy', async () => {
      const response = await request(app)
        .get(`/admin/moderation-queue?reviewedBy=${moderatorUser.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.length).toBe(1); // Only question3
      expect(response.body.questions[0].reviewedBy).toBe(moderatorUser.id);
    });

    it('should order questions by pinned first, then upvotes', async () => {
      // Pin question2 (5 upvotes)
      await testPrisma.question.update({
        where: { id: question2.id },
        data: { isPinned: true, pinnedBy: moderatorUser.id, pinnedAt: new Date() },
      });

      const response = await request(app)
        .get('/admin/moderation-queue?status=open')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.questions.length).toBe(2);
      // question2 should be first (pinned), even though question1 has more upvotes
      expect(response.body.questions[0].id).toBe(question2.id);
      expect(response.body.questions[0].isPinned).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue?limit=2&offset=1')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(2);
      expect(response.body.offset).toBe(1);
      expect(response.body.total).toBe(3);
      expect(response.body.questions.length).toBeLessThanOrEqual(2);
    });

    it('should deny access to members', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'member@example.com');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /admin/stats/moderation', () => {
    beforeEach(async () => {
      // Mark question3 as reviewed by moderatorUser
      await testPrisma.question.update({
        where: { id: question3.id },
        data: {
          reviewedBy: moderatorUser.id,
          reviewedAt: new Date(),
          isPinned: true,
          pinnedBy: moderatorUser.id,
        },
      });

      // Create another reviewed question by adminUser
      const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });

      await testPrisma.question.create({
        data: {
          tenantId: defaultTenant!.id,
          body: 'Another question',
          status: 'ANSWERED',
          responseText: 'Answer here',
          teamId: team.id,
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          isFrozen: true,
          frozenBy: adminUser.id,
        },
      });
    });

    it('should return overall moderation stats', async () => {
      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      expect(response.body.overall).toBeDefined();
      expect(response.body.overall.totalQuestionsReviewed).toBe(2); // question3 + new question
      expect(response.body.overall.totalQuestionsAnswered).toBe(2);
      expect(response.body.overall.totalQuestionsPinned).toBe(1);
      expect(response.body.overall.totalQuestionsFrozen).toBe(1);
      expect(response.body.overall.activeModerators).toBe(2); // moderator and admin
    });

    it('should return per-moderator stats', async () => {
      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      expect(response.body.byModerator).toBeDefined();
      expect(response.body.byModerator.length).toBe(2);

      // Find moderatorUser's stats
      const modStats = response.body.byModerator.find(
        (s: any) => s.moderatorId === moderatorUser.id
      );
      expect(modStats).toBeDefined();
      expect(modStats.questionsReviewed).toBe(1);
      expect(modStats.questionsAnswered).toBe(1);
      expect(modStats.questionsPinned).toBe(1);
      expect(modStats.moderatorName).toBe('Moderator User');
    });

    it('should filter stats by team', async () => {
      const response = await request(app)
        .get(`/admin/stats/moderation?teamId=${team.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      expect(response.body.overall.totalQuestionsReviewed).toBeGreaterThan(0);
    });

    it('should filter stats by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .get(
          `/admin/stats/moderation?startDate=${yesterday.toISOString().split('T')[0]}&endDate=${tomorrow.toISOString().split('T')[0]}`
        )
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      expect(response.body.overall.totalQuestionsReviewed).toBeGreaterThan(0);
    });

    it('should deny access to members', async () => {
      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'member@example.com');

      expect(response.status).toBe(403);
    });

    it('should calculate average response time', async () => {
      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      // avgResponseTime can be null if no questions have been answered with timing data
      expect(response.body.overall).toHaveProperty('avgResponseTime');
    });

    it('should sort moderators by questions reviewed', async () => {
      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);
      expect(response.body.byModerator.length).toBeGreaterThan(1);

      // Verify sorting - each moderator should have >= next moderator
      for (let i = 0; i < response.body.byModerator.length - 1; i++) {
        expect(response.body.byModerator[i].questionsReviewed).toBeGreaterThanOrEqual(
          response.body.byModerator[i + 1].questionsReviewed
        );
      }
    });
  });

  describe('Team Scoping for Admins vs Moderators', () => {
    let team2: Team;
    let question4: Question;

    beforeEach(async () => {
      const defaultTenant = await testPrisma.tenant.findUnique({ where: { slug: 'default' } });

      // Create a second team
      team2 = await testPrisma.team.create({
        data: {
          tenantId: defaultTenant!.id,
          name: 'Product',
          slug: 'product',
          description: 'Product team',
        },
      });

      // Moderator is NOT a member of team2
      // Admin IS a member of both teams
      await testPrisma.teamMembership.create({
        data: {
          userId: adminUser.id,
          teamId: team2.id,
          role: 'admin',
        },
      });

      // Create a question in team2
      question4 = await testPrisma.question.create({
        data: {
          tenantId: defaultTenant!.id,
          body: 'Product team question',
          status: 'OPEN',
          upvotes: 3,
          teamId: team2.id,
        },
      });
    });

    it('moderator should only see questions from their teams in moderation queue', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);

      // Should only see questions from team (Engineering), not team2 (Product)
      const questionIds = response.body.questions.map((q: any) => q.id);
      expect(questionIds).toContain(question1.id); // Engineering question
      expect(questionIds).toContain(question2.id); // Engineering question
      expect(questionIds).not.toContain(question4.id); // Product question (no access)
    });

    it('admin should see questions from all teams in moderation queue', async () => {
      const response = await request(app)
        .get('/admin/moderation-queue')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);

      // Should see questions from ALL teams
      const questionIds = response.body.questions.map((q: any) => q.id);
      expect(questionIds).toContain(question1.id); // Engineering question
      expect(questionIds).toContain(question4.id); // Product question
    });

    it('moderator should get 403 when filtering to a team they do not moderate', async () => {
      const response = await request(app)
        .get(`/admin/moderation-queue?teamId=${team2.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });

    it('moderator should only see stats from their teams', async () => {
      // Mark question4 as reviewed by adminUser
      await testPrisma.question.update({
        where: { id: question4.id },
        data: {
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          status: 'ANSWERED',
          responseText: 'Answer for product team',
        },
      });

      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(200);

      // Stats should only include question3 (Engineering team, reviewed by moderator)
      // Should NOT include question4 (Product team, reviewed by admin)
      expect(response.body.overall.totalQuestionsReviewed).toBe(1);
    });

    it('admin should see stats from all teams', async () => {
      // Mark question4 as reviewed by adminUser
      await testPrisma.question.update({
        where: { id: question4.id },
        data: {
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          status: 'ANSWERED',
          responseText: 'Answer for product team',
        },
      });

      const response = await request(app)
        .get('/admin/stats/moderation')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com');

      expect(response.status).toBe(200);

      // Should include both question3 and question4
      expect(response.body.overall.totalQuestionsReviewed).toBeGreaterThanOrEqual(2); // At least question3 and question4
    });

    it('moderator should get 403 when requesting stats for a team they do not moderate', async () => {
      const response = await request(app)
        .get(`/admin/stats/moderation?teamId=${team2.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('Moderation Feature Integration', () => {
    it('should track reviewedBy when answering a question', async () => {
      const response = await request(app)
        .post(`/questions/${question1.id}/respond`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com')
        .send({ response: 'This is the answer' });

      expect(response.status).toBe(200);
      expect(response.body.reviewedBy).toBe(moderatorUser.id);
      expect(response.body.reviewedAt).toBeDefined();

      // Verify in database
      const updated = await testPrisma.question.findUnique({ where: { id: question1.id } });
      expect(updated?.reviewedBy).toBe(moderatorUser.id);
      expect(updated?.reviewedAt).toBeDefined();
    });

    it('should not allow duplicate tags in bulk operation', async () => {
      // Add tag1 to question1
      await testPrisma.questionTag.create({
        data: { questionId: question1.id, tagId: tag1.id },
      });

      // Try to add again via bulk operation
      const response = await request(app)
        .post('/admin/bulk-tag')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'moderator@example.com')
        .send({
          questionIds: [question1.id],
          tagId: tag1.id,
          action: 'add',
        });

      // Should succeed (upsert handles duplicates)
      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(1);

      // Verify only one tag exists
      const tags = await testPrisma.questionTag.findMany({
        where: { questionId: question1.id, tagId: tag1.id },
      });
      expect(tags.length).toBe(1);
    });

    it('should handle mixed success/failure in bulk operations gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post('/admin/bulk-action')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', 'admin@example.com')
        .send({
          questionIds: [question1.id, nonExistentId],
          action: 'pin',
        });

      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(1);
      expect(response.body.errorCount).toBe(1);
      expect(response.body.total).toBe(2);
    });
  });
});
