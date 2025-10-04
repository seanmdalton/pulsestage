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

let prismaInstance: PrismaClient;

/**
 * Initialize team scoping middleware with Prisma client
 */
export function initTeamScopingMiddleware(prisma: PrismaClient) {
  prismaInstance = prisma;
}

/**
 * Middleware that extracts teamId from a question and adds it to req.params
 * This allows requirePermission to perform team-scoped checks
 */
export function extractQuestionTeam() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!prismaInstance) {
        throw new Error('Team scoping middleware not initialized');
      }

      const questionId = req.params.id;
      if (!questionId) {
        return res.status(400).json({ error: 'Question ID required' });
      }

      const question = await prismaInstance.question.findUnique({
        where: { id: questionId },
        select: { teamId: true }
      });

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Add teamId to params for requirePermission middleware
      if (question.teamId) {
        req.params.teamId = question.teamId;
      }

      next();
    } catch (error) {
      console.error('Team extraction error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify question team'
      });
    }
  };
}

/**
 * Get teams that a user has a specific role in
 */
export async function getUserTeamsByRole(userId: string, minimumRole: 'moderator' | 'admin' | 'owner'): Promise<string[]> {
  if (!prismaInstance) {
    throw new Error('Team scoping middleware not initialized');
  }

  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    member: 2,
    moderator: 3,
    admin: 4,
    owner: 5
  };

  const minimumRoleLevel = roleHierarchy[minimumRole];

  const memberships = await prismaInstance.teamMembership.findMany({
    where: {
      userId,
    },
    select: {
      teamId: true,
      role: true
    }
  });

  // Filter memberships by role hierarchy
  return memberships
    .filter(m => roleHierarchy[m.role] >= minimumRoleLevel)
    .map(m => m.teamId);
}

