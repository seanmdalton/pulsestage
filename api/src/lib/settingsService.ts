/*
 * Settings Service
 * Handles tenant-level settings with defaults
 */

import { PrismaClient } from '@prisma/client';

// Default settings structure
export const DEFAULT_SETTINGS = {
  questions: {
    minLength: 10,
    maxLength: 2000,
  },
  users: {
    defaultRole: 'member' as 'viewer' | 'member' | 'moderator' | 'admin' | 'owner',
  },
  security: {
    sessionTimeout: 8, // hours
    adminSessionTimeout: 8, // hours
    rateLimits: {
      questionsPerHour: 10,
      upvotesPerMinute: 20,
      responsesPerHour: 5,
      searchPerMinute: 30,
    },
  },
  branding: {
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    logoUrl: null as string | null,
    faviconUrl: null as string | null,
  },
  features: {
    allowAnonymousQuestions: true,
    requireQuestionApproval: false,
    enableEmailNotifications: false,
  },
};

export type TenantSettingsType = typeof DEFAULT_SETTINGS;

/**
 * Get tenant settings with defaults
 */
export async function getTenantSettings(
  prisma: PrismaClient,
  tenantId: string
): Promise<TenantSettingsType> {
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });

  if (!tenantSettings) {
    // Return defaults if no settings exist
    return DEFAULT_SETTINGS;
  }

  // Merge stored settings with defaults (in case new settings were added)
  const storedSettings = tenantSettings.settings as Record<string, any>;
  return deepMerge(DEFAULT_SETTINGS, storedSettings);
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  prisma: PrismaClient,
  tenantId: string,
  updates: Partial<TenantSettingsType>
): Promise<TenantSettingsType> {
  // Get current settings
  const currentSettings = await getTenantSettings(prisma, tenantId);

  // Merge updates with current settings
  const newSettings = deepMerge(currentSettings, updates);

  // Validate settings before saving
  validateSettings(newSettings);

  // Upsert settings
  await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      settings: newSettings as any,
    },
    update: {
      settings: newSettings as any,
    },
  });

  return newSettings;
}

/**
 * Deep merge two objects (for settings)
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Validate settings
 */
function validateSettings(settings: TenantSettingsType): void {
  // Question length validation
  if (settings.questions.minLength < 1 || settings.questions.minLength > 2000) {
    throw new Error('Question min length must be between 1 and 2000');
  }
  if (settings.questions.maxLength < 10 || settings.questions.maxLength > 5000) {
    throw new Error('Question max length must be between 10 and 5000');
  }
  if (settings.questions.minLength >= settings.questions.maxLength) {
    throw new Error('Question min length must be less than max length');
  }

  // Role validation
  const validRoles = ['viewer', 'member', 'moderator', 'admin', 'owner'];
  if (!validRoles.includes(settings.users.defaultRole)) {
    throw new Error(`Invalid default role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Session timeout validation (1 hour to 30 days = 720 hours)
  if (settings.security.sessionTimeout < 1 || settings.security.sessionTimeout > 720) {
    throw new Error('Session timeout must be between 1 and 720 hours (30 days)');
  }
  if (settings.security.adminSessionTimeout < 1 || settings.security.adminSessionTimeout > 720) {
    throw new Error('Admin session timeout must be between 1 and 720 hours (30 days)');
  }

  // Rate limits validation
  const { rateLimits } = settings.security;
  if (rateLimits.questionsPerHour < 1 || rateLimits.questionsPerHour > 100) {
    throw new Error('Questions per hour must be between 1 and 100');
  }
  if (rateLimits.upvotesPerMinute < 1 || rateLimits.upvotesPerMinute > 200) {
    throw new Error('Upvotes per minute must be between 1 and 200');
  }
  if (rateLimits.responsesPerHour < 1 || rateLimits.responsesPerHour > 50) {
    throw new Error('Responses per hour must be between 1 and 50');
  }
  if (rateLimits.searchPerMinute < 1 || rateLimits.searchPerMinute > 500) {
    throw new Error('Search per minute must be between 1 and 500');
  }

  // Color validation (basic hex check)
  if (settings.branding.primaryColor && !isValidHexColor(settings.branding.primaryColor)) {
    throw new Error('Primary color must be a valid hex color (e.g., #3B82F6)');
  }
  if (settings.branding.accentColor && !isValidHexColor(settings.branding.accentColor)) {
    throw new Error('Accent color must be a valid hex color (e.g., #10B981)');
  }
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}
