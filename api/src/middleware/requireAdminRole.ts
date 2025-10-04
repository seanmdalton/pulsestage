import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to require admin or owner role
 * Depends on mockAuthMiddleware being applied first to populate req.user
 */
export async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated (set by mockAuthMiddleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    // Get user's team memberships from database
    const memberships = await prisma.teamMembership.findMany({
      where: { userId: req.user.id }
    });

    // Check if user has admin or owner role in any team
    const hasAdminRole = memberships.some(membership => 
      membership.role === 'admin' || membership.role === 'owner'
    );

    if (!hasAdminRole) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin or owner role required' 
      });
    }

    next();
  } catch (error) {
    console.error('Error in requireAdminRole middleware:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify admin role' 
    });
  }
}
