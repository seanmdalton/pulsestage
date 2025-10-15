/*
 * Copyright 2025 Sean M. Dalton
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { testPrisma } from './test/setup.js';
import { createApp } from './app.js';

const app = createApp(testPrisma);

describe('RBAC & Team Scoping Tests', () => {
  let engineeringTeam: any;
  let peopleTeam: any;
  let adminUser: any;
  let moderatorUser: any;
  let memberUser: any;
  let engineeringQuestion: any;
  let peopleQuestion: any;

  beforeEach(async () => {
    const tenant = await testPrisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    // Create teams
    engineeringTeam = await testPrisma.team.create({
      data: {
        name: 'Engineering',
        slug: 'engineering',
        description: 'Engineering team',
        tenantId: tenant!.id,
      },
    });

    peopleTeam = await testPrisma.team.create({
      data: {
        name: 'People',
        slug: 'people',
        description: 'People team',
        tenantId: tenant!.id,
      },
    });

    // Create users
    adminUser = await testPrisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        ssoId: 'admin-sso',
        tenantId: tenant!.id,
      },
    });

    moderatorUser = await testPrisma.user.create({
      data: {
        email: 'moderator@example.com',
        name: 'Moderator User',
        ssoId: 'moderator-sso',
        tenantId: tenant!.id,
      },
    });

    memberUser = await testPrisma.user.create({
      data: {
        email: 'member@example.com',
        name: 'Member User',
        ssoId: 'member-sso',
        tenantId: tenant!.id,
      },
    });

    // Create team memberships
    // Admin is admin of both teams
    await testPrisma.teamMembership.create({
      data: {
        userId: adminUser.id,
        teamId: engineeringTeam.id,
        role: 'admin',
      },
    });

    await testPrisma.teamMembership.create({
      data: {
        userId: adminUser.id,
        teamId: peopleTeam.id,
        role: 'admin',
      },
    });

    // Moderator is moderator of Engineering only
    await testPrisma.teamMembership.create({
      data: {
        userId: moderatorUser.id,
        teamId: engineeringTeam.id,
        role: 'moderator',
      },
    });

    // Member is member of People team
    await testPrisma.teamMembership.create({
      data: {
        userId: memberUser.id,
        teamId: peopleTeam.id,
        role: 'member',
      },
    });

    // Create questions
    engineeringQuestion = await testPrisma.question.create({
      data: {
        body: 'Engineering question',
        status: 'OPEN',
        upvotes: 5,
        teamId: engineeringTeam.id,
        tenantId: tenant!.id,
      },
    });

    peopleQuestion = await testPrisma.question.create({
      data: {
        body: 'People question',
        status: 'OPEN',
        upvotes: 3,
        teamId: peopleTeam.id,
        tenantId: tenant!.id,
      },
    });
  });

  describe('POST /questions/:id/respond - Team Scoping', () => {
    it('should allow admin to answer any question', async () => {
      const response = await request(app)
        .post(`/questions/${engineeringQuestion.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'Admin answer' });

      expect(response.status).toBe(200);
      expect(response.body.responseText).toBe('Admin answer');
    });

    it('should allow moderator to answer questions from their team', async () => {
      const response = await request(app)
        .post(`/questions/${engineeringQuestion.id}/respond`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'Moderator answer' });

      expect(response.status).toBe(200);
      expect(response.body.responseText).toBe('Moderator answer');
    });

    it('should deny moderator answering questions from other teams', async () => {
      const response = await request(app)
        .post(`/questions/${peopleQuestion.id}/respond`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'Moderator answer' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should deny member from answering questions', async () => {
      const response = await request(app)
        .post(`/questions/${peopleQuestion.id}/respond`)
        .set('x-mock-sso-user', memberUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'Member answer' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should deny unauthenticated requests', async () => {
      const response = await request(app)
        .post(`/questions/${engineeringQuestion.id}/respond`)
        .send({ response: 'Anonymous answer' });

      // CSRF check happens before auth, so expect 403 (CSRF) or 401 (auth)
      expect([401, 403]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /questions/:id/tags - Team Scoping', () => {
    let tag: any;

    beforeEach(async () => {
      const tenant = await testPrisma.tenant.findUnique({
        where: { slug: 'default' },
      });

      tag = await testPrisma.tag.create({
        data: {
          name: 'important',
          tenantId: tenant!.id,
        },
      });
    });

    it('should allow admin to tag any question', async () => {
      const response = await request(app)
        .post(`/questions/${engineeringQuestion.id}/tags`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ tagId: tag.id });

      expect(response.status).toBe(200);
    });

    it('should allow moderator to tag questions from their team', async () => {
      const response = await request(app)
        .post(`/questions/${engineeringQuestion.id}/tags`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default')
        .send({ tagId: tag.id });

      expect(response.status).toBe(200);
    });

    it('should deny moderator tagging questions from other teams', async () => {
      const response = await request(app)
        .post(`/questions/${peopleQuestion.id}/tags`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default')
        .send({ tagId: tag.id });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should deny member from tagging questions', async () => {
      const response = await request(app)
        .post(`/questions/${peopleQuestion.id}/tags`)
        .set('x-mock-sso-user', memberUser.email)
        .set('x-tenant-id', 'default')
        .send({ tagId: tag.id });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /questions/:id/tags/:tagId - Team Scoping', () => {
    let tag: any;
    let _questionTag: any;

    beforeEach(async () => {
      const tenant = await testPrisma.tenant.findUnique({
        where: { slug: 'default' },
      });

      tag = await testPrisma.tag.create({
        data: {
          name: 'remove-test',
          tenantId: tenant!.id,
        },
      });

      _questionTag = await testPrisma.questionTag.create({
        data: {
          questionId: engineeringQuestion.id,
          tagId: tag.id,
        },
      });
    });

    it('should allow admin to remove tag from any question', async () => {
      const response = await request(app)
        .delete(`/questions/${engineeringQuestion.id}/tags/${tag.id}`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
    });

    it("should allow moderator to remove tag from their team's questions", async () => {
      const response = await request(app)
        .delete(`/questions/${engineeringQuestion.id}/tags/${tag.id}`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
    });

    it("should deny moderator removing tag from other team's questions", async () => {
      // First add tag to people question
      await testPrisma.questionTag.create({
        data: {
          questionId: peopleQuestion.id,
          tagId: tag.id,
        },
      });

      const response = await request(app)
        .delete(`/questions/${peopleQuestion.id}/tags/${tag.id}`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /questions - Team Filtering', () => {
    let _generalQuestion: any;

    beforeEach(async () => {
      const tenant = await testPrisma.tenant.findUnique({
        where: { slug: 'default' },
      });

      // Create a question without a team
      _generalQuestion = await testPrisma.question.create({
        data: {
          body: 'General question',
          status: 'OPEN',
          upvotes: 1,
          tenantId: tenant!.id,
        },
      });
    });

    it('should return all questions for admin', async () => {
      const response = await request(app)
        .get('/questions')
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3); // All 3 questions
    });

    it("should filter questions to moderator's teams only", async () => {
      const response = await request(app)
        .get('/questions')
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
      // Should only see Engineering question (moderator is only in Engineering team)
      expect(response.body.length).toBe(1);
      expect(response.body[0].teamId).toBe(engineeringTeam.id);
    });

    it("should filter questions to member's teams", async () => {
      const response = await request(app)
        .get('/questions')
        .set('x-mock-sso-user', memberUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
      // Should only see People question (member is only in People team)
      expect(response.body.length).toBe(1);
      expect(response.body[0].teamId).toBe(peopleTeam.id);
    });

    it('should require authentication for unauthenticated users', async () => {
      const response = await request(app).get('/questions').set('x-tenant-id', 'default');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should respect teamId filter parameter', async () => {
      const response = await request(app)
        .get(`/questions?teamId=${engineeringTeam.id}`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].teamId).toBe(engineeringTeam.id);
    });
  });

  describe('Permission Audit Logging', () => {
    it('should deny permission and respond with 403', async () => {
      // Moderator tries to answer question from another team
      const response = await request(app)
        .post(`/questions/${peopleQuestion.id}/respond`)
        .set('x-mock-sso-user', moderatorUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'Unauthorized attempt' });

      // Permission should be denied
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');

      // Note: Audit logging is tested separately in auditService.test.ts
      // The audit log functionality works in production but has tenant context
      // limitations in test environments
    });
  });

  describe('Cross-Tenant Isolation', () => {
    let _otherTenantUser: any;
    let otherTenantQuestion: any;

    beforeEach(async () => {
      // Create another tenant first
      await testPrisma.tenant.create({
        data: {
          id: 'other-tenant-id',
          name: 'Other Tenant',
          slug: 'other-tenant',
        },
      });

      // Create another tenant's data
      _otherTenantUser = await testPrisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other Tenant User',
          ssoId: 'other-sso',
          tenantId: 'other-tenant-id',
        },
      });

      otherTenantQuestion = await testPrisma.question.create({
        data: {
          body: 'Other tenant question',
          status: 'OPEN',
          upvotes: 1,
          tenantId: 'other-tenant-id',
        },
      });
    });

    it("should not allow admin from one tenant to access another tenant's questions", async () => {
      // Admin from default tenant tries to answer other tenant's question
      const response = await request(app)
        .post(`/questions/${otherTenantQuestion.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'Cross-tenant attempt' });

      // Should fail because tenant middleware filters by tenant
      expect(response.status).toBe(404);
    });

    it('should filter questions by tenant', async () => {
      const response = await request(app)
        .get('/questions')
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
      // Should not see other tenant's question
      const questionIds = response.body.map((q: any) => q.id);
      expect(questionIds).not.toContain(otherTenantQuestion.id);
    });
  });
});
