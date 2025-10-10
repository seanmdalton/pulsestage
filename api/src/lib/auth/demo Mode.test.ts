/**
 * Demo Mode Authentication Tests
 *
 * Tests the demo mode auto-login functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, User } from '@prisma/client';
import { Request, Response } from 'express';
import { getDemoModeConfig, demoModeLogin } from './demoMode.js';

describe('Demo Mode Authentication', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockReq = {
      query: {},
      session: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
        upsert: vi.fn(),
      },
    } as unknown as PrismaClient;
  });

  describe('getDemoModeConfig', () => {
    it('should return demo mode configuration when enabled', () => {
      const config = getDemoModeConfig();

      expect(config.enabled).toBe(true);
      expect(config.users).toHaveLength(4);
      expect(config.users).toContain('alice');
      expect(config.users).toContain('bob');
      expect(config.users).toContain('moderator');
      expect(config.users).toContain('admin');
    });

    it('should return disabled config when AUTH_MODE_DEMO is false', () => {
      const originalEnv = process.env.AUTH_MODE_DEMO;
      process.env.AUTH_MODE_DEMO = 'false';

      const config = getDemoModeConfig();

      expect(config.enabled).toBe(false);
      expect(config.users).toHaveLength(0);

      // Restore original env
      process.env.AUTH_MODE_DEMO = originalEnv;
    });
  });

  describe('demoModeLogin', () => {
    it('should return null if demo mode is disabled', async () => {
      const originalEnv = process.env.AUTH_MODE_DEMO;
      process.env.AUTH_MODE_DEMO = 'false';

      mockReq.query = { user: 'alice' };

      const result = await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);

      expect(result).toBeNull();

      // Restore original env
      process.env.AUTH_MODE_DEMO = originalEnv;
    });

    it('should return null if user parameter is missing', async () => {
      mockReq.query = {};

      const result = await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);

      expect(result).toBeNull();
    });

    it('should return null if user is not in allowed list', async () => {
      mockReq.query = { user: 'hacker' };

      const result = await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);

      expect(result).toBeNull();
    });

    it('should find existing demo user and return it', async () => {
      const mockUser: User = {
        id: '123',
        email: 'alice@demo.pulsestage.dev',
        name: 'Alice (Demo)',
        tenantId: 'demo-tenant-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: null,
      };

      mockReq.query = { user: 'alice' };
      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'alice@demo.pulsestage.dev',
        },
      });
    });

    it('should create new demo user if not found', async () => {
      const mockUser: User = {
        id: '456',
        email: 'bob@demo.pulsestage.dev',
        name: 'Bob (Demo)',
        tenantId: 'demo-tenant-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: null,
      };

      mockReq.query = { user: 'bob' };
      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockPrisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'bob@demo.pulsestage.dev',
          name: 'Bob (Demo)',
          tenant: {
            connect: {
              slug: 'demo',
            },
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockReq.query = { user: 'alice' };
      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);

      expect(result).toBeNull();
    });

    it('should capitalize user names correctly', async () => {
      const testCases = [
        { input: 'alice', expected: 'Alice (Demo)' },
        { input: 'bob', expected: 'Bob (Demo)' },
        { input: 'moderator', expected: 'Moderator (Demo)' },
        { input: 'admin', expected: 'Admin (Demo)' },
      ];

      for (const testCase of testCases) {
        mockReq.query = { user: testCase.input };
        (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (mockPrisma.user.create as ReturnType<typeof vi.fn>).mockImplementation(args => {
          expect(args.data.name).toBe(testCase.expected);
          return Promise.resolve({
            id: '123',
            email: `${testCase.input}@demo.pulsestage.dev`,
            name: testCase.expected,
            tenantId: 'demo-tenant-id',
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: null,
          });
        });

        await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);
      }
    });

    it('should use correct email domain for demo users', async () => {
      mockReq.query = { user: 'alice' };
      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (mockPrisma.user.create as ReturnType<typeof vi.fn>).mockImplementation(args => {
        expect(args.data.email).toBe('alice@demo.pulsestage.dev');
        expect(args.data.email).toMatch(/@demo\.pulsestage\.dev$/);
        return Promise.resolve({
          id: '123',
          email: args.data.email,
          name: 'Alice (Demo)',
          tenantId: 'demo-tenant-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: null,
        });
      });

      await demoModeLogin(mockReq as Request, mockRes as Response, mockPrisma);
    });
  });
});
