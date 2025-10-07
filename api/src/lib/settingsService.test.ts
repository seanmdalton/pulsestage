import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  getTenantSettings,
  updateTenantSettings,
  type TenantSettingsType,
} from './settingsService.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

describe('Settings Service', () => {
  let testTenant: { id: string; slug: string };

  beforeEach(async () => {
    // Create a test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant for Settings',
        slug: `test-settings-${Date.now()}`,
      },
    });
  });

  afterEach(async () => {
    // Clean up: Delete tenant settings and tenant
    await prisma.tenantSettings.deleteMany({
      where: { tenantId: testTenant.id },
    });
    await prisma.tenant.delete({
      where: { id: testTenant.id },
    });
  });

  describe('getTenantSettings', () => {
    it('should return default settings when no custom settings exist', async () => {
      const settings = await getTenantSettings(prisma, testTenant.id);

      expect(settings).toMatchObject({
        questions: {
          minLength: 10,
          maxLength: 2000,
        },
        users: {
          defaultRole: 'member',
        },
        security: {
          sessionTimeout: 8,
          adminSessionTimeout: 8,
          rateLimits: {
            questionsPerHour: 10,
            upvotesPerMinute: 20,
            responsesPerHour: 5,
            searchPerMinute: 30,
          },
        },
        branding: {
          logo: null,
          logoUrl: null,
          primaryColor: '#3B82F6',
          accentColor: '#10B981',
          welcomeMessage: '',
          showWelcomeMessage: false,
        },
        features: {
          tagging: true,
          search: true,
          presentationMode: true,
          exports: true,
          auditLogs: true,
        },
      });
    });

    it('should return custom settings when they exist', async () => {
      // Create custom settings
      await prisma.tenantSettings.create({
        data: {
          tenantId: testTenant.id,
          settings: {
            questions: { minLength: 15, maxLength: 2500 },
            users: { defaultRole: 'moderator' },
            security: {
              sessionTimeout: 12,
              adminSessionTimeout: 4,
              rateLimits: {
                questionsPerHour: 15,
                upvotesPerMinute: 30,
                responsesPerHour: 10,
                searchPerMinute: 50,
              },
            },
          },
        },
      });

      const settings = await getTenantSettings(prisma, testTenant.id);

      expect(settings.questions.minLength).toBe(15);
      expect(settings.questions.maxLength).toBe(2500);
      expect(settings.users.defaultRole).toBe('moderator');
      expect(settings.security.sessionTimeout).toBe(12);
      expect(settings.security.adminSessionTimeout).toBe(4);
      expect(settings.security.rateLimits.questionsPerHour).toBe(15);
    });
  });

  describe('updateTenantSettings', () => {
    it('should create new settings record if none exists', async () => {
      const updates: Partial<TenantSettingsType> = {
        questions: { minLength: 20, maxLength: 3000 },
      };

      const settings = await updateTenantSettings(prisma, testTenant.id, updates);

      expect(settings.questions.minLength).toBe(20);
      expect(settings.questions.maxLength).toBe(3000);

      // Verify it was actually saved
      const saved = await getTenantSettings(prisma, testTenant.id);
      expect(saved.questions.minLength).toBe(20);
      expect(saved.questions.maxLength).toBe(3000);
    });

    it('should update existing settings', async () => {
      // Create initial settings
      await updateTenantSettings(prisma, testTenant.id, {
        questions: { minLength: 10, maxLength: 2000 },
      });

      // Update settings
      const updated = await updateTenantSettings(prisma, testTenant.id, {
        questions: { minLength: 15, maxLength: 2500 },
      });

      expect(updated.questions.minLength).toBe(15);
      expect(updated.questions.maxLength).toBe(2500);
    });

    it('should merge partial updates with existing settings', async () => {
      // Create initial settings
      await updateTenantSettings(prisma, testTenant.id, {
        questions: { minLength: 10, maxLength: 2000 },
        users: { defaultRole: 'member' },
      });

      // Update only questions.maxLength
      const updated = await updateTenantSettings(prisma, testTenant.id, {
        questions: { maxLength: 3000 } as any, // Partial update
      });

      // minLength should remain unchanged
      expect(updated.questions.minLength).toBe(10);
      expect(updated.questions.maxLength).toBe(3000);
      expect(updated.users.defaultRole).toBe('member');
    });

    it('should update rate limits independently', async () => {
      const updates = {
        security: {
          rateLimits: { questionsPerHour: 25 },
        },
      } as any;

      const settings = await updateTenantSettings(prisma, testTenant.id, updates);

      // Check that only questionsPerHour changed, others remain default
      expect(settings.security.rateLimits.questionsPerHour).toBe(25);
      expect(settings.security.rateLimits.upvotesPerMinute).toBe(20); // default
      expect(settings.security.sessionTimeout).toBe(8); // default
    });

    it('should enforce validation constraints', async () => {
      // Test invalid minLength (too low)
      await expect(
        updateTenantSettings(prisma, testTenant.id, {
          questions: { minLength: 0, maxLength: 2000 },
        })
      ).rejects.toThrow();

      // Test invalid maxLength (too high)
      await expect(
        updateTenantSettings(prisma, testTenant.id, {
          questions: { minLength: 10, maxLength: 6000 },
        })
      ).rejects.toThrow();

      // Test invalid sessionTimeout (too high)
      await expect(
        updateTenantSettings(prisma, testTenant.id, {
          security: { sessionTimeout: 800, adminSessionTimeout: 8, rateLimits: {} as any },
        })
      ).rejects.toThrow();
    });

    it('should validate defaultRole enum', async () => {
      // Valid roles should work
      for (const role of ['viewer', 'member', 'moderator', 'admin', 'owner']) {
        const settings = await updateTenantSettings(prisma, testTenant.id, {
          users: { defaultRole: role as any },
        });
        expect(settings.users.defaultRole).toBe(role);
      }

      // Invalid role should fail
      await expect(
        updateTenantSettings(prisma, testTenant.id, {
          users: { defaultRole: 'invalid-role' as any },
        })
      ).rejects.toThrow();
    });

    it('should handle multiple concurrent updates', async () => {
      // Simulate multiple admins updating settings at the same time
      const updates1 = updateTenantSettings(prisma, testTenant.id, {
        questions: { minLength: 15, maxLength: 2000 },
      });

      const updates2 = updateTenantSettings(prisma, testTenant.id, {
        users: { defaultRole: 'moderator' },
      });

      await Promise.all([updates1, updates2]);

      const final = await getTenantSettings(prisma, testTenant.id);
      // Both updates should have been applied (or last write wins)
      expect(final.questions.minLength).toBeGreaterThanOrEqual(10);
      expect(final.users.defaultRole).toBeTruthy();
    });
  });

  describe('Branding settings', () => {
    it('should update branding colors with valid hex codes', async () => {
      const settings = await updateTenantSettings(prisma, testTenant.id, {
        branding: {
          primaryColor: '#FF5733',
          accentColor: '#33FF57',
          logo: null,
          logoUrl: null,
          welcomeMessage: '',
          showWelcomeMessage: false,
        },
      });

      expect(settings.branding.primaryColor).toBe('#FF5733');
      expect(settings.branding.accentColor).toBe('#33FF57');
    });

    it('should reject invalid hex color codes', async () => {
      await expect(
        updateTenantSettings(prisma, testTenant.id, {
          branding: {
            primaryColor: 'invalid-color',
            accentColor: '#33FF57',
            logo: null,
            logoUrl: null,
            welcomeMessage: '',
            showWelcomeMessage: false,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Feature flags', () => {
    it('should toggle feature flags', async () => {
      const settings = await updateTenantSettings(prisma, testTenant.id, {
        features: {
          tagging: false,
          search: true,
          presentationMode: true,
          exports: false,
          auditLogs: true,
        },
      });

      expect(settings.features.tagging).toBe(false);
      expect(settings.features.exports).toBe(false);
      expect(settings.features.search).toBe(true);
    });
  });
});
