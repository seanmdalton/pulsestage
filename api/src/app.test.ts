import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { testPrisma } from './test/setup.js';

const app = createApp(testPrisma);

describe('API Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('service', 'ama-api');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /questions', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user for authenticated requests
      const tenant = await testPrisma.tenant.findUnique({
        where: { slug: 'default' },
      });

      testUser = await testPrisma.user.create({
        data: {
          tenantId: tenant!.id,
          email: 'test@example.com',
          name: 'Test User',
          ssoId: 'test-123',
        },
      });
    });

    it('should create a question with valid data', async () => {
      const response = await request(app)
        .post('/questions')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default')
        .send({ body: 'What is your favorite color?' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.body).toBe('What is your favorite color?');
      expect(response.body.upvotes).toBe(1); // Author automatically upvotes their own question
      expect(response.body.status).toBe('OPEN');
    });

    it('should reject question with body too short', async () => {
      const response = await request(app)
        .post('/questions')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default')
        .send({ body: 'Hi' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject question with body too long', async () => {
      const response = await request(app)
        .post('/questions')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default')
        .send({ body: 'a'.repeat(2001) });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject question with missing body', async () => {
      const response = await request(app)
        .post('/questions')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/questions')
        .send({ body: 'What is your favorite color?' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /questions', () => {
    beforeEach(async () => {
      // Create test questions
      await testPrisma.question.create({
        data: {
          body: 'Open question 1',
          upvotes: 5,
          status: 'OPEN',
          tenantId: 'default-tenant-id',
        },
      });
      await testPrisma.question.create({
        data: {
          body: 'Open question 2',
          upvotes: 10,
          status: 'OPEN',
          tenantId: 'default-tenant-id',
        },
      });
      await testPrisma.question.create({
        data: {
          body: 'Answered question',
          status: 'ANSWERED',
          responseText: 'The answer',
          respondedAt: new Date(),
          tenantId: 'default-tenant-id',
        },
      });
    });

    it('should return open questions by default', async () => {
      const response = await request(app).get('/questions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe('OPEN');
      expect(response.body[1].status).toBe('OPEN');
    });

    it('should return open questions when status=open', async () => {
      const response = await request(app).get('/questions?status=open');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((q: any) => q.status === 'OPEN')).toBe(true);
    });

    it('should return answered questions when status=answered', async () => {
      const response = await request(app).get('/questions?status=answered');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('ANSWERED');
      expect(response.body[0].responseText).toBe('The answer');
    });

    it('should return questions sorted by upvotes desc', async () => {
      const response = await request(app).get('/questions?status=open');

      expect(response.status).toBe(200);
      expect(response.body[0].upvotes).toBe(10);
      expect(response.body[1].upvotes).toBe(5);
    });
  });

  describe('POST /questions/:id/upvote', () => {
    it('should increment upvotes for existing question', async () => {
      const question = await testPrisma.question.create({
        data: { body: 'Test question', upvotes: 0, tenantId: 'default-tenant-id' },
      });

      const response = await request(app).post(`/questions/${question.id}/upvote`);

      expect(response.status).toBe(200);
      expect(response.body.upvotes).toBe(1);
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app).post('/questions/non-existent-id/upvote');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /questions/:id/respond', () => {
    let question: any;
    let adminUser: any;
    let testTeam: any;

    beforeEach(async () => {
      // Create a test team
      testTeam = await testPrisma.team.create({
        data: {
          name: 'Test Team',
          slug: 'test-team',
          tenantId: 'default-tenant-id',
        },
      });

      // Create an admin user
      adminUser = await testPrisma.user.create({
        data: {
          email: 'admin@test.com',
          name: 'Admin User',
          ssoId: 'admin@test.com',
          tenantId: 'default-tenant-id',
        },
      });

      // Create team membership with admin role
      await testPrisma.teamMembership.create({
        data: {
          userId: adminUser.id,
          teamId: testTeam.id,
          role: 'admin',
        },
      });

      question = await testPrisma.question.create({
        data: { body: 'Test question', tenantId: 'default-tenant-id' },
      });
    });

    it('should respond to question with valid admin role', async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'This is my answer' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ANSWERED');
      expect(response.body.responseText).toBe('This is my answer');
      expect(response.body.respondedAt).toBeTruthy();
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-tenant-id', 'default')
        .send({ response: 'This is my answer' });

      // CSRF check happens before auth, so expect 403 (CSRF failure) or 401 (auth failure)
      expect([401, 403]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject with missing response', async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject with response too short', async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .post('/questions/non-existent-id/respond')
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: 'This is my answer' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Management Endpoints', () => {
    let tenant: any;
    let adminUser: any;
    let regularUser: any;
    let testTeam: any;

    beforeEach(async () => {
      // Get or create tenant
      tenant = await testPrisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
          name: 'Default Organization',
          slug: 'default',
        },
      });

      // Create test team
      testTeam = await testPrisma.team.create({
        data: {
          tenantId: tenant.id,
          name: 'Test Team',
          slug: 'test-team',
          isActive: true,
        },
      });

      // Create admin user
      adminUser = await testPrisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@test.com',
          name: 'Admin User',
          ssoId: 'admin-123',
        },
      });

      // Create admin membership
      await testPrisma.teamMembership.create({
        data: {
          userId: adminUser.id,
          teamId: testTeam.id,
          role: 'admin',
        },
      });

      // Create regular user
      regularUser = await testPrisma.user.create({
        data: {
          tenantId: tenant.id,
          email: 'user@test.com',
          name: 'Regular User',
          ssoId: 'user-123',
        },
      });

      // Create member membership
      await testPrisma.teamMembership.create({
        data: {
          userId: regularUser.id,
          teamId: testTeam.id,
          role: 'member',
        },
      });
    });

    describe('GET /admin/users', () => {
      it('should return all users for admin', async () => {
        const response = await request(app)
          .get('/admin/users')
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('users');
        expect(Array.isArray(response.body.users)).toBe(true);
        expect(response.body.users.length).toBeGreaterThanOrEqual(2);

        const userEmails = response.body.users.map((u: any) => u.email);
        expect(userEmails).toContain(adminUser.email);
        expect(userEmails).toContain(regularUser.email);
      });

      it('should include user memberships and counts', async () => {
        const response = await request(app)
          .get('/admin/users')
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(200);
        const user = response.body.users.find((u: any) => u.email === adminUser.email);
        expect(user).toHaveProperty('memberships');
        expect(user).toHaveProperty('_count');
        expect(user._count).toHaveProperty('questions');
        expect(user._count).toHaveProperty('upvotes');
      });

      it('should reject non-admin users', async () => {
        const memberUser = await testPrisma.user.create({
          data: {
            tenantId: tenant.id,
            email: 'member@test.com',
            name: 'Member User',
            ssoId: 'member-123',
          },
        });

        const response = await request(app)
          .get('/admin/users')
          .set('x-mock-sso-user', memberUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(403);
      });

      it('should reject unauthenticated requests', async () => {
        const response = await request(app).get('/admin/users').set('x-tenant-id', 'default');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /teams/:teamId/members', () => {
      it('should return team members for admin', async () => {
        const response = await request(app)
          .get(`/teams/${testTeam.id}/members`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('members');
        expect(Array.isArray(response.body.members)).toBe(true);
        expect(response.body.members.length).toBe(2);
      });

      it('should include user details in memberships', async () => {
        const response = await request(app)
          .get(`/teams/${testTeam.id}/members`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(200);
        const member = response.body.members[0];
        expect(member).toHaveProperty('user');
        expect(member.user).toHaveProperty('email');
        expect(member.user).toHaveProperty('name');
        expect(member).toHaveProperty('role');
      });

      it('should return 404 for non-existent team', async () => {
        const response = await request(app)
          .get('/teams/00000000-0000-0000-0000-000000000000/members')
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(404);
      });
    });

    describe('POST /teams/:teamId/members', () => {
      let newUser: any;

      beforeEach(async () => {
        newUser = await testPrisma.user.create({
          data: {
            tenantId: tenant.id,
            email: 'newuser@test.com',
            name: 'New User',
            ssoId: 'newuser-123',
          },
        });
      });

      it('should add user to team as admin', async () => {
        const response = await request(app)
          .post(`/teams/${testTeam.id}/members`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            userId: newUser.id,
            role: 'moderator',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.membership).toHaveProperty('role', 'moderator');
        expect(response.body.membership).toHaveProperty('userId', newUser.id);
      });

      it('should default to member role if not specified', async () => {
        const anotherUser = await testPrisma.user.create({
          data: {
            tenantId: tenant.id,
            email: 'another@test.com',
            name: 'Another User',
            ssoId: 'another-123',
          },
        });

        const response = await request(app)
          .post(`/teams/${testTeam.id}/members`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            userId: anotherUser.id,
          });

        expect(response.status).toBe(200);
        expect(response.body.membership).toHaveProperty('role', 'member');
      });

      it('should reject duplicate membership', async () => {
        const response = await request(app)
          .post(`/teams/${testTeam.id}/members`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            userId: regularUser.id,
            role: 'moderator',
          });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('error');
      });

      it('should reject invalid user ID', async () => {
        const response = await request(app)
          .post(`/teams/${testTeam.id}/members`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            userId: '00000000-0000-0000-0000-000000000000',
            role: 'member',
          });

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /teams/:teamId/members/:userId', () => {
      it('should update user role as admin', async () => {
        const response = await request(app)
          .put(`/teams/${testTeam.id}/members/${regularUser.id}`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            role: 'moderator',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.membership).toHaveProperty('role', 'moderator');
      });

      it('should reject invalid role', async () => {
        const response = await request(app)
          .put(`/teams/${testTeam.id}/members/${regularUser.id}`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            role: 'invalid-role',
          });

        expect(response.status).toBe(400);
      });

      it('should return 404 for non-member user', async () => {
        const nonMember = await testPrisma.user.create({
          data: {
            tenantId: tenant.id,
            email: 'nonmember@test.com',
            name: 'Non Member',
            ssoId: 'nonmember-123',
          },
        });

        const response = await request(app)
          .put(`/teams/${testTeam.id}/members/${nonMember.id}`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default')
          .send({
            role: 'moderator',
          });

        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /teams/:teamId/members/:userId', () => {
      it('should remove user from team as admin', async () => {
        const response = await request(app)
          .delete(`/teams/${testTeam.id}/members/${regularUser.id}`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);

        // Verify user was removed
        const membership = await testPrisma.teamMembership.findFirst({
          where: {
            userId: regularUser.id,
            teamId: testTeam.id,
          },
        });
        expect(membership).toBeNull();
      });

      it('should prevent removing last owner', async () => {
        // Make admin the only owner
        await testPrisma.teamMembership.updateMany({
          where: {
            userId: adminUser.id,
            teamId: testTeam.id,
          },
          data: {
            role: 'owner',
          },
        });

        const response = await request(app)
          .delete(`/teams/${testTeam.id}/members/${adminUser.id}`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('last owner');
      });

      it('should return 404 for non-member user', async () => {
        const nonMember = await testPrisma.user.create({
          data: {
            tenantId: tenant.id,
            email: 'nonmember2@test.com',
            name: 'Non Member 2',
            ssoId: 'nonmember2-123',
          },
        });

        const response = await request(app)
          .delete(`/teams/${testTeam.id}/members/${nonMember.id}`)
          .set('x-mock-sso-user', adminUser.email)
          .set('x-tenant-id', 'default');

        expect(response.status).toBe(404);
      });
    });
  });
});
