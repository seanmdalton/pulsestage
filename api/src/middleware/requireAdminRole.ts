import { Request, Response, NextFunction } from 'express';

// Mock data for role checking (simplified version)
const mockTeamMemberships = [
  { userId: 'john.doe@company.com', teamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4', role: 'admin' },
  { userId: 'jane.smith@company.com', teamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4', role: 'member' },
  { userId: 'bob.wilson@company.com', teamId: 'f4be47d7-9c97-4087-94cf-c914f01a0ab4', role: 'owner' },
];

export async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  try {
    // First check if we have a mock SSO user
    const mockSSOHeader = req.headers['x-mock-sso-user'] as string;
    
    if (!mockSSOHeader) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Mock SSO authentication required' 
      });
    }

    // Check if user has admin or owner role in any team
    const userMemberships = mockTeamMemberships.filter(m => m.userId === mockSSOHeader);
    const hasAdminRole = userMemberships.some(membership => 
      membership.role === 'admin' || membership.role === 'owner'
    );

    if (!hasAdminRole) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin or owner role required' 
      });
    }

    // Add user info to request for use in endpoints
    req.user = {
      id: mockSSOHeader,
      email: mockSSOHeader,
      name: mockSSOHeader,
      ssoId: mockSSOHeader,
      role: 'admin' // We know they have admin role at this point
    };

    next();
  } catch (error) {
    console.error('Error in requireAdminRole middleware:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify admin role' 
    });
  }
}
