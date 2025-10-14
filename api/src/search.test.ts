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

describe('Enhanced Search & Filtering', () => {
  let team: any;
  let tag1: any;
  let tag2: any;
  let question1: any;
  let question2: any;
  let question3: any;
  let testUser: any;

  beforeEach(async () => {
    // Create test user for authentication
    testUser = await testPrisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'default-tenant-id',
      },
    });

    // Create team
    team = await testPrisma.team.create({
      data: {
        name: 'Search Test Team',
        slug: 'search-test',
        tenantId: 'default-tenant-id',
      },
    });

    // Add test user to the team
    await testPrisma.teamMembership.create({
      data: {
        userId: testUser.id,
        teamId: team.id,
        role: 'member',
      },
    });

    // Create tags
    tag1 = await testPrisma.tag.create({
      data: {
        name: 'urgent',
        color: '#FF0000',
        tenantId: 'default-tenant-id',
      },
    });

    tag2 = await testPrisma.tag.create({
      data: {
        name: 'follow-up',
        color: '#00FF00',
        tenantId: 'default-tenant-id',
      },
    });

    // Create questions with different content
    question1 = await testPrisma.question.create({
      data: {
        body: 'What is the company policy on remote work?',
        status: 'OPEN',
        upvotes: 10,
        teamId: team.id,
        tenantId: 'default-tenant-id',
        createdAt: new Date('2025-01-01'),
      },
    });

    question2 = await testPrisma.question.create({
      data: {
        body: 'How do we handle customer complaints?',
        status: 'OPEN',
        upvotes: 5,
        teamId: team.id,
        tenantId: 'default-tenant-id',
        createdAt: new Date('2025-01-15'),
      },
    });

    question3 = await testPrisma.question.create({
      data: {
        body: 'What are the benefits of working remotely?',
        status: 'ANSWERED',
        responseText: 'Remote work offers flexibility and work-life balance.',
        upvotes: 3,
        teamId: team.id,
        tenantId: 'default-tenant-id',
        createdAt: new Date('2025-02-01'),
      },
    });

    // Add tags to questions
    await testPrisma.questionTag.create({
      data: {
        questionId: question1.id,
        tagId: tag1.id,
      },
    });

    await testPrisma.questionTag.create({
      data: {
        questionId: question2.id,
        tagId: tag2.id,
      },
    });

    // Update search vectors for existing questions
    await testPrisma.$executeRaw`
      UPDATE "Question" 
      SET search_vector = 
        setweight(to_tsvector('english', COALESCE(body, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE("responseText", '')), 'B')
      WHERE "tenantId" = 'default-tenant-id'
    `;
  });

  describe('Full-Text Search', () => {
    it('should search questions by keyword', async () => {
      const response = await request(app)
        .get('/questions?search=remote')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1); // Only question1 is OPEN with "remote"

      // Should include question1 (OPEN with "remote")
      const ids = response.body.map((q: any) => q.id);
      expect(ids).toContain(question1.id);
      expect(ids).not.toContain(question2.id);
      // question3 is ANSWERED so not included in default OPEN filter
    });

    it('should search in both question body and response', async () => {
      const response = await request(app)
        .get('/questions?search=flexibility&status=ANSWERED')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question3.id); // "flexibility" in response
    });

    it('should handle multi-word search', async () => {
      const response = await request(app)
        .get('/questions?search=company policy')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBe(question1.id);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/questions?search=nonexistentword12345')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    it('should support prefix/substring matching', async () => {
      // Search for "polic" should match "policy"
      const response = await request(app)
        .get('/questions?search=polic')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      // Should find question1 which contains "policy"
      const ids = response.body.map((q: any) => q.id);
      expect(ids).toContain(question1.id);
    });
  });

  describe('Tag Filtering', () => {
    it('should filter questions by tag', async () => {
      const response = await request(app)
        .get(`/questions?tagId=${tag1.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question1.id);
    });

    it('should return empty for non-existent tag', async () => {
      const response = await request(app)
        .get('/questions?tagId=00000000-0000-0000-0000-000000000000')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter questions after dateFrom', async () => {
      const response = await request(app)
        .get('/questions?dateFrom=2025-01-10')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      // Should include question2 (created Jan 15, OPEN status)
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const ids = response.body.map((q: any) => q.id);
      expect(ids).toContain(question2.id);
      expect(ids).not.toContain(question1.id); // Created Jan 1
    });

    it('should filter questions before dateTo', async () => {
      const response = await request(app)
        .get('/questions?dateTo=2025-01-20')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      // Should include question1 and question2 (created before Jan 20)
      const ids = response.body.map((q: any) => q.id);
      expect(ids).toContain(question1.id);
      expect(ids).toContain(question2.id);
      expect(ids).not.toContain(question3.id); // Created Feb 1
    });

    it('should filter questions in date range', async () => {
      const response = await request(app)
        .get('/questions?dateFrom=2025-01-10&dateTo=2025-01-20')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question2.id); // Only one in range
    });
  });

  describe('Combined Filters', () => {
    it('should combine search with team filter', async () => {
      const response = await request(app)
        .get(`/questions?search=remote&teamId=${team.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1); // Only question1 is OPEN with "remote"
    });

    it('should combine search with tag filter', async () => {
      const response = await request(app)
        .get(`/questions?search=policy&tagId=${tag1.id}`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question1.id);
    });

    it('should combine search with date range', async () => {
      const response = await request(app)
        .get('/questions?search=remote&status=ANSWERED&dateFrom=2025-01-15')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question3.id); // Only ANSWERED "remote" after Jan 15
    });

    it('should combine all filters', async () => {
      const response = await request(app)
        .get(`/questions?search=remote&teamId=${team.id}&dateFrom=2024-12-01&dateTo=2025-01-31`)
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      // Should find questions with "remote" in the date range for the team
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Status Filtering with Search', () => {
    it('should search only OPEN questions', async () => {
      const response = await request(app)
        .get('/questions?search=remote&status=OPEN')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question1.id);
      expect(response.body[0].status).toBe('OPEN');
    });

    it('should search only ANSWERED questions', async () => {
      const response = await request(app)
        .get('/questions?search=remote&status=ANSWERED')
        .set('x-tenant-id', 'default')
        .set('x-mock-sso-user', testUser.email);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(question3.id);
      expect(response.body[0].status).toBe('ANSWERED');
    });
  });
});
