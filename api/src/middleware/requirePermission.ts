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

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hasPermission, getHighestRole, type Permission, type Role } from '../lib/permissions.js';
import { auditService } from '../lib/auditService.js';

let prismaInstance: PrismaClient;

/**
 * Initialize the permission middleware with Prisma client
 */
export function initPermissionMiddleware(prisma: PrismaClient) {
  prismaInstance = prisma;
}

/**
 * Get the user's highest role across all their team memberships
 */
async function getUserHighestRole(userId: string): Promise<Role> {
  if (!prismaInstance) {
    throw new Error('Permission middleware not initialized. Call initPermissionMiddleware() first.');
  }

  const memberships = await prismaInstance.teamMembership.findMany({
    where: { userId },
    select: { role: true }
  });

  if (memberships.length === 0) {
    return 'member'; // Default role for authenticated users with no team memberships
  }

  const roles = memberships.map(m => m.role);
  return getHighestRole(roles);
}

/**
 * Get the user's role in a specific team
 */
async function getUserRoleInTeam(userId: string, teamId: string): Promise<Role | null> {
  if (!prismaInstance) {
    throw new Error('Permission middleware not initialized.');
  }

  const membership = await prismaInstance.teamMembership.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    },
    select: { role: true }
  });

  return membership ? (membership.role as Role) : null;
}

/**
 * Middleware factory that creates permission-checking middleware
 * 
 * @param permission - The permission required to access the route
 * @param options - Optional configuration
 *   - teamIdParam: Name of route param containing team ID (for team-scoped checks)
 *   - teamIdQuery: Name of query param containing team ID
 *   - allowUnauthenticated: Allow viewer role (default: false)
 */
export function requirePermission(
  permission: Permission,
  options: {
    teamIdParam?: string;
    teamIdQuery?: string;
    allowUnauthenticated?: boolean;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        if (options.allowUnauthenticated) {
          // Check if viewer role has this permission
          if (hasPermission('viewer', permission)) {
            return next();
          }
        }
        
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Get team ID if this is a team-scoped permission
      let teamId: string | undefined;
      if (options.teamIdParam) {
        teamId = req.params[options.teamIdParam];
      } else if (options.teamIdQuery) {
        teamId = req.query[options.teamIdQuery] as string;
      }

      // Determine which role to check
      let userRole: Role;
      if (teamId) {
        // Team-scoped: check user's role in this specific team
        const roleInTeam = await getUserRoleInTeam(req.user.id, teamId);
        if (!roleInTeam) {
          // User is not a member of this team
          // Check if they have global permissions (admin/owner)
          userRole = await getUserHighestRole(req.user.id);
          
          // If they don't have permission to view all teams, deny access
          if (!hasPermission(userRole, 'team.view.all')) {
            await auditService.log(req, {
              action: 'permission.denied',
              entityType: 'Permission',
              metadata: {
                permission,
                reason: 'not_team_member',
                teamId,
                attemptedRole: userRole
              }
            });

            return res.status(403).json({
              error: 'Forbidden',
              message: 'You do not have permission to access this team'
            });
          }
        } else {
          userRole = roleInTeam;
        }
      } else {
        // Global permission: use highest role across all teams
        userRole = await getUserHighestRole(req.user.id);
      }

      // Check if user has the required permission
      if (!hasPermission(userRole, permission)) {
        // Log permission denial to audit
        await auditService.log(req, {
          action: 'permission.denied',
          entityType: 'Permission',
          metadata: {
            permission,
            userRole,
            teamId,
            reason: 'insufficient_permissions'
          }
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `This action requires ${permission} permission`
        });
      }

      // Permission granted - attach role to request for downstream use
      req.userRole = userRole;
      if (teamId) {
        req.teamId = teamId;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify permissions'
      });
    }
  };
}

/**
 * Middleware that requires user to be at least a certain role level
 * Useful for "moderator or higher" type checks
 */
export function requireRole(minimumRole: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userRole = await getUserHighestRole(req.user.id);
      
      // Check role hierarchy
      const roleHierarchy: Record<Role, number> = {
        viewer: 1,
        member: 2,
        moderator: 3,
        admin: 4,
        owner: 5
      };

      if (roleHierarchy[userRole] < roleHierarchy[minimumRole]) {
        await auditService.log(req, {
          action: 'permission.denied',
          entityType: 'Permission',
          metadata: {
            requiredRole: minimumRole,
            userRole,
            reason: 'insufficient_role'
          }
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `This action requires at least ${minimumRole} role`
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify role'
      });
    }
  };
}

// Extend Express Request type to include role information
declare global {
  namespace Express {
    interface Request {
      userRole?: Role;
      teamId?: string;
    }
  }
}

