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
import { testPrisma as prisma } from '../test/setup.js';
import { AuditService } from './auditService.js';
import { Request } from 'express';

describe('AuditService', () => {
  let auditService: AuditService;
  let testTenantId: string;
  let testUserId: string;

  beforeEach(async () => {
    auditService = new AuditService(prisma);

    // Get default tenant
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: 'default' },
    });
    testTenantId = tenant.id;

    // Create a test user
    const user = await prisma.user.create({
      data: {
        tenantId: testTenantId,
        email: 'audit-test@example.com',
        name: 'Audit Test User',
      },
    });
    testUserId = user.id;
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const mockReq = {
        user: { id: testUserId, email: 'audit-test@example.com' },
        ip: '127.0.0.1',
        get: (header: string) => (header === 'user-agent' ? 'Test User Agent' : null),
        socket: { remoteAddress: '127.0.0.1' },
        tenant: { tenantId: testTenantId, tenantSlug: 'default' },
      } as any as Request;

      // Set tenant context using AsyncLocalStorage
      const { runInTenantContext } = await import('../middleware/tenantContext.js');
      await runInTenantContext({ tenantId: testTenantId, tenantSlug: 'default' }, async () => {
        await auditService.log(mockReq, {
          action: 'test.action',
          entityType: 'TestEntity',
          entityId: 'test-123',
          before: { status: 'old' },
          after: { status: 'new' },
          metadata: { testKey: 'testValue' },
        });
      });

      // Wait a bit for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await prisma.auditLog.findMany({
        where: { tenantId: testTenantId },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('test.action');
      expect(logs[0].entityType).toBe('TestEntity');
      expect(logs[0].entityId).toBe('test-123');
      expect(logs[0].userId).toBe(testUserId);
      expect(logs[0].ipAddress).toBe('127.0.0.1');
      expect(logs[0].userAgent).toBe('Test User Agent');
    });

    it('should handle system actions (no user)', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: () => null,
        socket: { remoteAddress: '127.0.0.1' },
        tenant: { tenantId: testTenantId, tenantSlug: 'default' },
      } as any as Request;

      const { runInTenantContext } = await import('../middleware/tenantContext.js');
      await runInTenantContext({ tenantId: testTenantId, tenantSlug: 'default' }, async () => {
        await auditService.log(mockReq, {
          action: 'system.cleanup',
          entityType: 'System',
        });
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await prisma.auditLog.findMany({
        where: { action: 'system.cleanup' },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBeNull();
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      // Create some test audit logs
      await prisma.auditLog.createMany({
        data: [
          {
            tenantId: testTenantId,
            userId: testUserId,
            action: 'question.answer',
            entityType: 'Question',
            entityId: 'q1',
            ipAddress: '127.0.0.1',
          },
          {
            tenantId: testTenantId,
            userId: testUserId,
            action: 'team.create',
            entityType: 'Team',
            entityId: 't1',
            ipAddress: '127.0.0.1',
          },
          {
            tenantId: testTenantId,
            action: 'system.backup',
            entityType: 'System',
            ipAddress: '127.0.0.1',
          },
        ],
      });
    });

    it('should retrieve all logs for a tenant', async () => {
      const logs = await auditService.getLogs(testTenantId);
      expect(logs).toHaveLength(3);
    });

    it('should filter by action', async () => {
      const logs = await auditService.getLogs(testTenantId, {
        action: 'question.answer',
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('question.answer');
    });

    it('should filter by entity type', async () => {
      const logs = await auditService.getLogs(testTenantId, {
        entityType: 'Team',
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].entityType).toBe('Team');
    });

    it('should filter by user', async () => {
      const logs = await auditService.getLogs(testTenantId, {
        userId: testUserId,
      });
      expect(logs).toHaveLength(2);
    });

    it('should respect limit', async () => {
      const logs = await auditService.getLogs(testTenantId, {
        limit: 2,
      });
      expect(logs).toHaveLength(2);
    });

    it('should respect offset', async () => {
      const logs = await auditService.getLogs(testTenantId, {
        limit: 2,
        offset: 1,
      });
      expect(logs).toHaveLength(2);
    });

    it('should include user details in results', async () => {
      const logs = await auditService.getLogs(testTenantId, {
        action: 'question.answer',
      });
      expect(logs[0].user).toBeDefined();
      expect(logs[0].user?.email).toBe('audit-test@example.com');
    });
  });

  describe('getCount', () => {
    beforeEach(async () => {
      await prisma.auditLog.createMany({
        data: [
          {
            tenantId: testTenantId,
            action: 'question.answer',
            entityType: 'Question',
            ipAddress: '127.0.0.1',
          },
          {
            tenantId: testTenantId,
            action: 'question.answer',
            entityType: 'Question',
            ipAddress: '127.0.0.1',
          },
          {
            tenantId: testTenantId,
            action: 'team.create',
            entityType: 'Team',
            ipAddress: '127.0.0.1',
          },
        ],
      });
    });

    it('should count all logs', async () => {
      const count = await auditService.getCount(testTenantId);
      expect(count).toBe(3);
    });

    it('should count filtered logs', async () => {
      const count = await auditService.getCount(testTenantId, {
        action: 'question.answer',
      });
      expect(count).toBe(2);
    });
  });

  describe('tenant isolation', () => {
    it('should not return logs from other tenants', async () => {
      // Create second tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          slug: 'other-tenant',
          name: 'Other Tenant',
        },
      });

      // Create audit log in other tenant
      await prisma.auditLog.create({
        data: {
          tenantId: otherTenant.id,
          action: 'secret.action',
          entityType: 'Secret',
          ipAddress: '127.0.0.1',
        },
      });

      // Query logs for test tenant
      const logs = await auditService.getLogs(testTenantId);

      // Should not see the other tenant's log
      expect(logs.find(log => log.action === 'secret.action')).toBeUndefined();
    });
  });
});
