import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OAuthStrategy, getOAuthConfig } from './oauth';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  tenant: {
    findFirst: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

describe('OAuthStrategy', () => {
  let oauthStrategy: OAuthStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    oauthStrategy = new OAuthStrategy(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getOAuthConfig', () => {
    it('should return OAuth configuration', () => {
      const config = getOAuthConfig();
      expect(config).toBeDefined();
    });

    it('should load GitHub config from environment', () => {
      const originalGithubId = process.env.GITHUB_CLIENT_ID;
      process.env.GITHUB_CLIENT_ID = 'test-github-id';

      const config = getOAuthConfig();
      expect(config).toBeDefined();

      process.env.GITHUB_CLIENT_ID = originalGithubId;
    });
  });

  describe('createOrUpdateUser', () => {
    const mockTenant = {
      id: 'tenant-123',
      slug: 'test-tenant',
      name: 'Test Tenant',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProfile = {
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    };

    it('should create a new user if not exists', async () => {
      const ssoId = 'github|123456';

      (mockPrisma.user.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.create as any).mockResolvedValue({
        id: 'user-123',
        email: mockProfile.email,
        name: mockProfile.name,
        ssoId,
        tenantId: mockTenant.id,
      });

      const result = await oauthStrategy.createOrUpdateUser(ssoId, mockProfile, mockTenant);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockProfile.email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: mockTenant.id,
            email: mockProfile.email,
          },
        },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should update existing user with ssoId', async () => {
      const ssoId = 'github|123456';
      const existingUser = {
        id: 'user-123',
        email: mockProfile.email,
        name: 'Old Name',
        ssoId: null,
        tenantId: mockTenant.id,
      };

      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);
      (mockPrisma.user.update as any).mockResolvedValue({
        ...existingUser,
        ssoId,
        name: mockProfile.name,
      });

      const result = await oauthStrategy.createOrUpdateUser(ssoId, mockProfile, mockTenant);

      expect(result).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: {
          ssoId,
          name: mockProfile.name,
        },
      });
    });

    it('should handle user without name', async () => {
      const ssoId = 'github|123456';
      const profileWithoutName = {
        email: 'test@example.com',
        picture: 'https://example.com/avatar.jpg',
      };

      (mockPrisma.user.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.create as any).mockResolvedValue({
        id: 'user-123',
        email: profileWithoutName.email,
        name: profileWithoutName.email, // Should default to email
        ssoId,
        tenantId: mockTenant.id,
      });

      const result = await oauthManager.createOrUpdateUser(ssoId, profileWithoutName, mockTenant);

      expect(result).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: profileWithoutName.email,
          }),
        })
      );
    });

    it('should not update if ssoId already matches', async () => {
      const ssoId = 'github|123456';
      const existingUser = {
        id: 'user-123',
        email: mockProfile.email,
        name: mockProfile.name,
        ssoId,
        tenantId: mockTenant.id,
      };

      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);

      const result = await oauthStrategy.createOrUpdateUser(ssoId, mockProfile, mockTenant);

      expect(result).toEqual(existingUser);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const ssoId = 'github|123456';

      (mockPrisma.user.findUnique as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(oauthManager.createOrUpdateUser(ssoId, mockProfile, mockTenant)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('validateProfile', () => {
    it('should validate correct profile', () => {
      const profile = {
        email: 'test@example.com',
        name: 'Test User',
      };

      expect(() => oauthStrategy.validateProfile(profile)).not.toThrow();
    });

    it('should reject profile without email', () => {
      const profile = {
        name: 'Test User',
      } as any;

      expect(() => oauthStrategy.validateProfile(profile)).toThrow();
    });

    it('should reject profile with invalid email', () => {
      const profile = {
        email: 'not-an-email',
        name: 'Test User',
      };

      expect(() => oauthStrategy.validateProfile(profile)).toThrow();
    });

    it('should accept profile without name', () => {
      const profile = {
        email: 'test@example.com',
      };

      expect(() => oauthStrategy.validateProfile(profile)).not.toThrow();
    });
  });
});
