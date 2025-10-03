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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createTenantResolverMiddleware } from './tenantResolver.js';
import { getTenantContext } from './tenantContext.js';

describe('tenantResolver', () => {
  let mockPrisma: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        findUnique: vi.fn()
      }
    };

    mockReq = {
      headers: {},
      hostname: 'localhost',
      get: vi.fn()
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
  });

  describe('tenant resolution from header', () => {
    it('should resolve tenant from x-tenant-id header', async () => {
      mockReq.headers = { 'x-tenant-id': 'alpha' };
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'alpha-id',
        slug: 'alpha',
        name: 'Alpha Tenant'
      });

      const middleware = createTenantResolverMiddleware(mockPrisma as PrismaClient);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'alpha' },
        select: { id: true, slug: true, name: true }
      });
      expect(mockReq.tenant).toEqual({
        tenantId: 'alpha-id',
        tenantSlug: 'alpha'
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('tenant not found', () => {
    it('should return 404 when tenant does not exist', async () => {
      mockReq.headers = { 'x-tenant-id': 'nonexistent' };
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const middleware = createTenantResolverMiddleware(mockPrisma as PrismaClient);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tenant not found',
        message: "Tenant 'nonexistent' does not exist."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockReq.headers = { 'x-tenant-id': 'alpha' };
      mockPrisma.tenant.findUnique.mockRejectedValue(new Error('Database error'));

      const middleware = createTenantResolverMiddleware(mockPrisma as PrismaClient);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to resolve tenant context'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('tenant context storage', () => {
    it('should store tenant in AsyncLocalStorage', async () => {
      mockReq.headers = { 'x-tenant-id': 'alpha' };
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'alpha-id',
        slug: 'alpha',
        name: 'Alpha Tenant'
      });

      const middleware = createTenantResolverMiddleware(mockPrisma as PrismaClient);
      
      // Mock next to check context inside the middleware
      mockNext = vi.fn(() => {
        const context = getTenantContext();
        expect(context.tenantId).toBe('alpha-id');
        expect(context.tenantSlug).toBe('alpha');
      });

      await middleware(mockReq as Request, mockRes as Response, mockNext);
    });
  });
});

