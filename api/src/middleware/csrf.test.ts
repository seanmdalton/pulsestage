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
import { testPrisma } from '../test/setup.js';
import { createApp } from '../app.js';
import { createTestUser } from '../test/testHelpers.js';

const app = createApp(testPrisma);

describe('CSRF Protection', () => {
  let testUser: any;
  let testTeam: any;
  let csrfToken: string;
  let csrfCookie: string;

  beforeEach(async () => {
    const tenant = await testPrisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    // Create test user and team
    testUser = await createTestUser(testPrisma, tenant!.id, {
      email: 'csrf-test@example.com',
      name: 'CSRF Test User',
      ssoId: 'csrf-test-sso',
    });

    testTeam = await testPrisma.team.create({
      data: {
        name: 'CSRF Test Team',
        slug: 'csrf-test',
        description: 'Test team for CSRF',
        tenantId: tenant!.id,
      },
    });

    await testPrisma.teamMembership.create({
      data: {
        userId: testUser.id,
        teamId: testTeam.id,
        role: 'admin',
      },
    });
  });

  describe('GET /csrf-token', () => {
    it('should provide a CSRF token', async () => {
      const response = await request(app).get('/csrf-token').set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('csrfToken');
      expect(response.body.csrfToken).toBeTypeOf('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(10);

      // Should set a cookie
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];
      expect(cookies.some((cookie: string) => cookie.startsWith('x-csrf-token='))).toBe(true);
    });

    it('should set HttpOnly and SameSite cookie attributes', async () => {
      const response = await request(app).get('/csrf-token').set('x-tenant-id', 'default');

      const cookies = Array.isArray(response.headers['set-cookie'])
        ? response.headers['set-cookie']
        : [response.headers['set-cookie']];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('x-csrf-token='));

      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).toContain('HttpOnly');
      expect(csrfCookie).toContain('SameSite=Lax');
    });
  });

  describe('CSRF Token Validation', () => {
    beforeEach(async () => {
      // Get a valid CSRF token
      const tokenResponse = await request(app).get('/csrf-token').set('x-tenant-id', 'default');

      csrfToken = tokenResponse.body.csrfToken;

      // Extract cookie from response
      const cookies = Array.isArray(tokenResponse.headers['set-cookie'])
        ? tokenResponse.headers['set-cookie']
        : [tokenResponse.headers['set-cookie']];
      csrfCookie = cookies.find((cookie: string) => cookie.startsWith('x-csrf-token=')) || '';
    });

    it('should accept valid CSRF token via header', async () => {
      const response = await request(app)
        .post('/teams')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default')
        .set('x-csrf-token', csrfToken)
        .set('Cookie', csrfCookie)
        .send({
          name: 'Test Team',
          slug: 'test-team',
          description: 'Test',
        });

      // Should succeed (not 403)
      expect(response.status).not.toBe(403);
    });

    it('should reject request without CSRF token', async () => {
      const response = await request(app).post('/teams').set('x-tenant-id', 'default').send({
        name: 'Test Team',
        slug: 'test-team',
        description: 'Test',
      });

      // Should fail with CSRF error (403) or auth error (401)
      expect([401, 403]).toContain(response.status);
    });

    it('should reject request with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/teams')
        .set('x-tenant-id', 'default')
        .set('x-csrf-token', 'invalid-token-12345')
        .send({
          name: 'Test Team',
          slug: 'test-team',
          description: 'Test',
        });

      expect([401, 403]).toContain(response.status);
    });

    it('should skip CSRF for mock authentication', async () => {
      // Mock auth should bypass CSRF checks
      const response = await request(app)
        .post('/teams')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default')
        .send({
          name: 'Mock Auth Team',
          slug: 'mock-auth-team',
          description: 'Test',
        });

      // Should succeed without CSRF token when using mock auth
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Protected Endpoints', () => {
    let question: any;

    beforeEach(async () => {
      const tenant = await testPrisma.tenant.findUnique({
        where: { slug: 'default' },
      });

      question = await testPrisma.question.create({
        data: {
          body: 'CSRF test question',
          status: 'OPEN',
          upvotes: 1,
          teamId: testTeam.id,
          tenantId: tenant!.id,
        },
      });
    });

    it('POST /questions/:id/respond should require CSRF token', async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-tenant-id', 'default')
        .send({ response: 'Answer without CSRF' });

      expect([401, 403]).toContain(response.status);
    });

    it('POST /teams should require CSRF token', async () => {
      const response = await request(app).post('/teams').set('x-tenant-id', 'default').send({
        name: 'CSRF Test',
        slug: 'csrf-test-2',
      });

      expect([401, 403]).toContain(response.status);
    });

    it('PUT /teams/:id should require CSRF token', async () => {
      const response = await request(app)
        .put(`/teams/${testTeam.id}`)
        .set('x-tenant-id', 'default')
        .send({
          name: 'Updated Name',
        });

      expect([401, 403]).toContain(response.status);
    });

    it('DELETE /teams/:id should require CSRF token', async () => {
      const response = await request(app)
        .delete(`/teams/${testTeam.id}`)
        .set('x-tenant-id', 'default');

      expect([401, 403]).toContain(response.status);
    });

    it('POST /tags should require CSRF token', async () => {
      const response = await request(app).post('/tags').set('x-tenant-id', 'default').send({
        name: 'CSRF Tag',
        color: '#FF0000',
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Safe Methods (No CSRF Required)', () => {
    it('GET /questions should not require CSRF', async () => {
      const response = await request(app)
        .get('/questions')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
    });

    it('GET /teams should not require CSRF', async () => {
      const response = await request(app).get('/teams').set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
    });

    it('GET /tags should not require CSRF', async () => {
      const response = await request(app)
        .get('/tags')
        .set('x-mock-sso-user', testUser.email)
        .set('x-tenant-id', 'default');

      expect(response.status).toBe(200);
    });
  });
});
