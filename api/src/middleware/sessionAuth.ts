/*
 * Session Authentication Middleware
 *
 * Primary responsibilities:
 * 1. Read authenticated user from req.session (set by demo auth or OAuth)
 * 2. Populate req.user for downstream middleware and route handlers
 * 3. Support x-mock-sso-user header for automated testing (dev/test only)
 *
 * This middleware is required for all session-based authentication to work,
 * including demo mode and OAuth. The x-mock-sso-user header is blocked in
 * production for security.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Flag to track if mock data has been loaded
let mockDataLoaded = false;

// Function to reset mock data (for testing)
export function resetMockData() {
  mockDataLoaded = false;
  mockUsers.length = 0;
  mockTeamMemberships.length = 0;
  mockUserPreferences.length = 0;
}

// Function to load mock data from database
async function loadMockData() {
  if (mockDataLoaded) return;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Loading mock SSO data from database...');
    }

    // Load all users from all tenants for mock SSO
    const users = await prisma.user.findMany();

    // Load team memberships
    const memberships = await prisma.teamMembership.findMany({
      where: {
        userId: {
          in: users.map(u => u.id),
        },
      },
    });

    // Load user preferences
    const preferences = await prisma.userPreferences.findMany({
      where: {
        userId: {
          in: users.map(u => u.id),
        },
      },
    });

    // Populate mock data arrays
    mockUsers.length = 0;
    mockTeamMemberships.length = 0;
    mockUserPreferences.length = 0;

    // Add users with their roles from memberships
    for (const user of users) {
      const userMembership = memberships.find(m => m.userId === user.id);
      mockUsers.push({
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name || user.email,
        ssoId: user.ssoId || user.email,
        role: userMembership?.role || 'member',
      });
    }

    // Add memberships
    for (const membership of memberships) {
      mockTeamMemberships.push({
        userId: membership.userId,
        teamId: membership.teamId,
        role: membership.role,
      });
    }

    // Add preferences
    for (const preference of preferences) {
      mockUserPreferences.push({
        userId: preference.userId,
        favoriteTeams: Array.isArray(preference.favoriteTeams)
          ? (preference.favoriteTeams as string[])
          : [],
        defaultTeamId: preference.defaultTeamId,
        emailNotifications: preference.emailNotifications ?? true,
      });
    }

    mockDataLoaded = true;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[OK] Loaded ${mockUsers.length} mock users, ${mockTeamMemberships.length} memberships, ${mockUserPreferences.length} preferences`
      );
    }
  } catch (error) {
    console.error('[ERROR] Error loading mock SSO data:', error);
  }
}

// Mock user database - will be populated with real IDs from database
const mockUsers: Array<{
  id: string;
  tenantId: string;
  email: string;
  name: string;
  ssoId: string;
  role: string;
}> = [];

// Mock team memberships - will be populated with real IDs from database
const mockTeamMemberships: Array<{
  userId: string;
  teamId: string;
  role: string;
}> = [];

// Mock user preferences - will be populated with real IDs from database
const mockUserPreferences: Array<{
  userId: string;
  favoriteTeams: string[];
  defaultTeamId: string | null;
  emailNotifications: boolean;
}> = [];

// Extend Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: (typeof mockUsers)[0];
  }
}

// Session authentication middleware
export async function sessionAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Security: Only allow Mock SSO header in development/test environments
    const mockSSOHeader = req.headers['x-mock-sso-user'] as string;
    const isProduction = process.env.NODE_ENV === 'production';

    if (mockSSOHeader && isProduction) {
      console.error(
        '🚨 SECURITY: Mock SSO authentication attempted in production! Rejecting request.'
      );
      return res.status(403).json({
        error: 'Mock SSO not available',
        message: 'Mock SSO authentication is only available in development/test environments.',
      });
    }

    // Load mock data if not already loaded
    await loadMockData();

    // Priority 1: Check for session user (from demo auth or OAuth)
    if (req.session?.user) {
      const sessionUser = req.session.user;

      // Validate session version (invalidate sessions after demo reset)
      const currentTenant = (req as any).tenant;
      if (currentTenant && req.session.sessionVersion !== undefined) {
        const tenantSettings = await prisma.tenantSettings.findUnique({
          where: { tenantId: currentTenant.tenantId },
        });
        const currentVersion = (tenantSettings?.settings as any)?.sessionVersion || 0;

        if (req.session.sessionVersion < currentVersion) {
          console.log(
            `[SESSION] Invalidating stale session (version ${req.session.sessionVersion} < ${currentVersion})`
          );
          // Destroy the session
          req.session.destroy(() => {
            // Session destroyed, continue without auth
          });
          req.user = undefined;
          return next();
        }
      }

      // Find full user details from mock data
      let user = mockUsers.find(u => u.id === sessionUser.id || u.email === sessionUser.email);

      // If not found in mock data, fetch from database (handles newly created users)
      if (!user && sessionUser.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: sessionUser.id },
          include: {
            teamMemberships: true,
          },
        });

        if (dbUser) {
          const userMembership = dbUser.teamMemberships[0];
          user = {
            id: dbUser.id,
            tenantId: dbUser.tenantId,
            email: dbUser.email,
            name: dbUser.name || dbUser.email,
            ssoId: dbUser.ssoId || dbUser.email,
            role: userMembership?.role || 'member',
          };
          // Add to mock users cache for next time
          mockUsers.push(user);
        }
      }

      if (user) {
        // Validate that user belongs to the current tenant
        const currentTenant = (req as any).tenant;

        if (currentTenant && user.tenantId !== currentTenant.tenantId) {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `[ERROR] Session Auth: User ${user.email} (tenant: ${user.tenantId}) cannot authenticate in tenant ${currentTenant.tenantId}`
            );
          }
          // User belongs to different tenant - don't authenticate
          req.user = undefined;
        } else {
          req.user = user;
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `🔐 Session Auth: Authenticated user ${user.name} (${user.email}) in tenant ${user.tenantId}`
            );
          }
        }
      }

      return next();
    }

    // Priority 2: Check for mock SSO header (simulating SSO provider)
    // (mockSSOHeader already declared at top of function)
    if (mockSSOHeader) {
      // Find user by email or SSO ID
      const user = mockUsers.find(u => u.email === mockSSOHeader || u.ssoId === mockSSOHeader);

      if (user) {
        // Validate that user belongs to the current tenant
        const currentTenant = (req as any).tenant;

        if (currentTenant && user.tenantId !== currentTenant.tenantId) {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `[ERROR] Mock SSO: User ${user.email} (tenant: ${user.tenantId}) cannot authenticate in tenant ${currentTenant.tenantId}`
            );
          }
          // User belongs to different tenant - don't authenticate
          req.user = undefined;
        } else {
          req.user = user;
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `🔐 Mock SSO: Authenticated user ${user.name} (${user.email}) in tenant ${user.tenantId}`
            );
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error in mock auth middleware:', error);
    next();
  }
}

// Require authentication middleware (renamed from requireMockAuth for clarity)
export async function requireSessionAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Load mock data if not already loaded
    await loadMockData();

    if (!req.user) {
      const currentTenant = (req as any).tenant;
      const availableUsers = currentTenant
        ? mockUsers.filter(u => u.tenantId === currentTenant.tenantId)
        : mockUsers;

      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide x-mock-sso-user header for local testing',
        currentTenant: currentTenant?.tenantSlug || 'unknown',
        availableUsers: availableUsers.map(u => ({ email: u.email, name: u.name, ssoId: u.ssoId })),
      });
    }

    next();
  } catch (error) {
    console.error('Error in require mock auth middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get user's teams with membership info
export async function getUserTeamsWithMembership(userId: string, prisma: any) {
  await loadMockData();

  // Fetch fresh memberships from database with team data
  // Only return teams the user is actually a member of
  const userMemberships = await prisma.teamMembership.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: {
            select: { questions: true },
          },
        },
      },
    },
  });

  // Fetch preferences from database
  const userPreferences = await prisma.userPreferences.findUnique({
    where: { userId },
    select: {
      favoriteTeams: true,
      defaultTeamId: true,
    },
  });

  // Map memberships to team objects with user context
  return userMemberships
    .filter((membership: any) => membership.team.isActive) // Only active teams
    .map((membership: any) => {
      const favoriteTeamsArray = Array.isArray(userPreferences?.favoriteTeams)
        ? userPreferences.favoriteTeams
        : [];
      const isFavorite = favoriteTeamsArray.includes(membership.team.id) || false;
      const isDefault = userPreferences?.defaultTeamId === membership.team.id;

      return {
        ...membership.team,
        userRole: membership.role, // Actual role from TeamMembership
        isFavorite,
        isDefault,
        memberCount: Math.floor(Math.random() * 10) + 1, // Mock member count
      };
    });
}

// Get user preferences
export async function getUserPreferences(userId: string): Promise<{
  userId: string;
  favoriteTeams: string[];
  defaultTeamId: string | null;
  emailNotifications: boolean;
}> {
  await loadMockData();

  return (
    mockUserPreferences.find(p => p.userId === userId) || {
      userId,
      favoriteTeams: [],
      defaultTeamId: null,
      emailNotifications: true,
    }
  );
}

// Toggle team favorite
export async function toggleTeamFavorite(userId: string, teamId: string) {
  const prefs = await getUserPreferences(userId);
  const isFavorite = prefs.favoriteTeams.includes(teamId);

  if (isFavorite) {
    prefs.favoriteTeams = prefs.favoriteTeams.filter(id => id !== teamId);
  } else {
    prefs.favoriteTeams.push(teamId);
  }

  return !isFavorite; // Return new favorite status
}

// Set default team
export async function setDefaultTeam(userId: string, teamId: string) {
  const prefs = await getUserPreferences(userId);
  prefs.defaultTeamId = teamId;
  return prefs;
}

// Set user preferences (for updating the mock data cache)
export async function setUserPreferences(
  userId: string,
  preferences: {
    favoriteTeams?: string[];
    defaultTeamId?: string | null;
    emailNotifications?: boolean;
  }
) {
  await loadMockData();

  const existingPrefs = mockUserPreferences.find(p => p.userId === userId);

  if (existingPrefs) {
    // Update existing preferences
    if (preferences.favoriteTeams !== undefined) {
      existingPrefs.favoriteTeams = preferences.favoriteTeams;
    }
    if (preferences.defaultTeamId !== undefined) {
      existingPrefs.defaultTeamId = preferences.defaultTeamId;
    }
    if (preferences.emailNotifications !== undefined) {
      existingPrefs.emailNotifications = preferences.emailNotifications;
    }
  } else {
    // Create new preferences
    mockUserPreferences.push({
      userId,
      favoriteTeams: preferences.favoriteTeams || [],
      defaultTeamId: preferences.defaultTeamId || null,
      emailNotifications:
        preferences.emailNotifications !== undefined ? preferences.emailNotifications : true,
    });
  }
}
