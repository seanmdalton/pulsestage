/*
 * Mock Authentication Middleware
 * 
 * This simulates SSO authentication for local development.
 * In production, this would be replaced with real SSO integration.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Flag to track if mock data has been loaded
let mockDataLoaded = false;

// Function to load mock data from database
async function loadMockData() {
  if (mockDataLoaded) return;
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Loading mock SSO data from database...');
    }
    
    // Load users
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'john.doe@company.com',
            'jane.smith@company.com', 
            'bob.wilson@company.com'
          ]
        }
      }
    });
    
    // Load team memberships
    const memberships = await prisma.teamMembership.findMany({
      where: {
        userId: {
          in: users.map(u => u.id)
        }
      }
    });
    
    // Load user preferences
    const preferences = await prisma.userPreferences.findMany({
      where: {
        userId: {
          in: users.map(u => u.id)
        }
      }
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
        email: user.email,
        name: user.name || user.email,
        ssoId: user.ssoId || user.email,
        role: userMembership?.role || 'member'
      });
    }
    
    // Add memberships
    for (const membership of memberships) {
      mockTeamMemberships.push({
        userId: membership.userId,
        teamId: membership.teamId,
        role: membership.role
      });
    }
    
    // Add preferences
    for (const preference of preferences) {
      mockUserPreferences.push({
        userId: preference.userId,
        favoriteTeams: Array.isArray(preference.favoriteTeams) ? preference.favoriteTeams as string[] : [],
        defaultTeamId: preference.defaultTeamId
      });
    }
    
    mockDataLoaded = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Loaded ${mockUsers.length} mock users, ${mockTeamMemberships.length} memberships, ${mockUserPreferences.length} preferences`);
    }
    
  } catch (error) {
    console.error('❌ Error loading mock SSO data:', error);
  }
}

// Mock user database - will be populated with real IDs from database
const mockUsers: Array<{
  id: string;
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
}> = [];

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: typeof mockUsers[0];
    }
  }
}

// Mock authentication middleware
export async function mockAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Load mock data if not already loaded
    await loadMockData();
    
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
  } catch (error) {
    console.error('Error in mock auth middleware:', error);
    next();
  }
}

// Require authentication middleware
export async function requireMockAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Load mock data if not already loaded
    await loadMockData();
    
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide x-mock-sso-user header for local testing',
        availableUsers: mockUsers.map(u => ({ email: u.email, name: u.name, ssoId: u.ssoId }))
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
export async function getUserPreferences(userId: string): Promise<{
  userId: string;
  favoriteTeams: string[];
  defaultTeamId: string | null;
}> {
  await loadMockData();
  
  return mockUserPreferences.find(p => p.userId === userId) || {
    userId,
    favoriteTeams: [],
    defaultTeamId: null
  };
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
