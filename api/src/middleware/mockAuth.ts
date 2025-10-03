/*
 * Mock Authentication Middleware
 * 
 * This simulates SSO authentication for local development.
 * In production, this would be replaced with real SSO integration.
 */

import { Request, Response, NextFunction } from 'express';

// Mock user database - using real user IDs from database
const mockUsers = [
  {
    id: 'b454a85b-5a76-4b06-90db-71a483ff8409', // Real ID from database
    email: 'john.doe@company.com',
    name: 'John Doe',
    ssoId: 'sso-john-doe-123',
    role: 'admin'
  },
  {
    id: '0b9ab53c-e821-4731-834c-1b017dd56a24', // Real ID from database
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    ssoId: 'sso-jane-smith-456',
    role: 'member'
  },
  {
    id: 'baee1e15-2209-481f-adb1-f57278c60457', // Real ID from database
    email: 'bob.wilson@company.com', 
    name: 'Bob Wilson',
    ssoId: 'sso-bob-wilson-789',
    role: 'owner'
  }
];

// Mock team memberships (using real team ID and real user IDs from database)
const mockTeamMemberships = [
  { userId: 'b454a85b-5a76-4b06-90db-71a483ff8409', teamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4', role: 'admin' },
  { userId: '0b9ab53c-e821-4731-834c-1b017dd56a24', teamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4', role: 'member' },
  { userId: 'baee1e15-2209-481f-adb1-f57278c60457', teamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4', role: 'owner' }
];

// Mock user preferences (using real team ID and real user IDs from database)
const mockUserPreferences: Array<{
  userId: string;
  favoriteTeams: string[];
  defaultTeamId: string | null;
}> = [
  { userId: 'b454a85b-5a76-4b06-90db-71a483ff8409', favoriteTeams: ['f4be47d7-9c97-4087-94cf-c914f01a0ab4'], defaultTeamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4' },
  { userId: '0b9ab53c-e821-4731-834c-1b017dd56a24', favoriteTeams: ['f4be47d7-9c97-4087-94cf-c914f01a0ab4'], defaultTeamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4' },
  { userId: 'baee1e15-2209-481f-adb1-f57278c60457', favoriteTeams: [], defaultTeamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4' }
];

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: typeof mockUsers[0];
    }
  }
}

// Mock authentication middleware
export function mockAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for mock SSO header (simulating SSO provider)
  const mockSSOHeader = req.headers['x-mock-sso-user'] as string;
  
  if (mockSSOHeader) {
    // Find user by email or SSO ID
    const user = mockUsers.find(u => 
      u.email === mockSSOHeader || u.ssoId === mockSSOHeader
    );
    
    if (user) {
      req.user = user;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Mock SSO: Authenticated user ${user.name} (${user.email})`);
      }
    }
  }
  
  next();
}

// Require authentication middleware
export function requireMockAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide x-mock-sso-user header for local testing',
      availableUsers: mockUsers.map(u => ({ email: u.email, name: u.name, ssoId: u.ssoId }))
    });
  }
  
  next();
}

// Get user's teams with membership info
export async function getUserTeamsWithMembership(userId: string, prisma: any) {
  const userMemberships = mockTeamMemberships.filter(m => m.userId === userId);
  const userPreferences = mockUserPreferences.find(p => p.userId === userId);
  
  // Get real teams from database
  const realTeams = await prisma.team.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });
  
  // Map real teams to user context
  return realTeams.map((team: any) => {
    // Use real team ID directly since we updated mock data to use real IDs
    const membership = userMemberships.find(m => m.teamId === team.id);
    const isFavorite = userPreferences?.favoriteTeams.includes(team.id) || false;
    const isDefault = userPreferences?.defaultTeamId === team.id;
    
    return {
      ...team,
      userRole: membership?.role || 'member', // Default to member for all teams
      isFavorite,
      isDefault,
      memberCount: Math.floor(Math.random() * 10) + 1, // Mock member count
    };
  });
}

// Get user preferences
export function getUserPreferences(userId: string): {
  userId: string;
  favoriteTeams: string[];
  defaultTeamId: string | null;
} {
  return mockUserPreferences.find(p => p.userId === userId) || {
    userId,
    favoriteTeams: [],
    defaultTeamId: null
  };
}

// Toggle team favorite
export function toggleTeamFavorite(userId: string, teamId: string) {
  const prefs = getUserPreferences(userId);
  const isFavorite = prefs.favoriteTeams.includes(teamId);
  
  if (isFavorite) {
    prefs.favoriteTeams = prefs.favoriteTeams.filter(id => id !== teamId);
  } else {
    prefs.favoriteTeams.push(teamId);
  }
  
  return !isFavorite; // Return new favorite status
}

// Set default team
export function setDefaultTeam(userId: string, teamId: string) {
  const prefs = getUserPreferences(userId);
  prefs.defaultTeamId = teamId;
  return prefs;
}
