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

import type { PrismaClient, Team } from '@prisma/client';
import { getOrCreateGeneralTeam } from '../lib/teams.js';

/**
 * Create a test user with a primary team.
 * Automatically assigns to General team if no specific team provided.
 * Optionally creates a team membership with the specified role.
 */
export async function createTestUser(
  prisma: PrismaClient,
  tenantId: string,
  userData: {
    email: string;
    name: string;
    ssoId?: string;
    primaryTeamId?: string;
    role?: 'viewer' | 'member' | 'moderator' | 'admin' | 'owner';
  }
) {
  let primaryTeamId = userData.primaryTeamId;

  // If no team specified, use General team
  if (!primaryTeamId) {
    const generalTeam = await getOrCreateGeneralTeam(prisma, tenantId);
    primaryTeamId = generalTeam.id;
  }

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      ssoId: userData.ssoId,
      tenantId,
      primaryTeamId,
    },
  });

  // Create team membership if role is specified
  if (userData.role) {
    await prisma.teamMembership.create({
      data: {
        userId: user.id,
        teamId: primaryTeamId,
        role: userData.role,
      },
    });
  }

  return user;
}

/**
 * Get the first team for a tenant (usually General team).
 * Useful for tests that just need any valid team.
 */
export async function getFirstTeam(prisma: PrismaClient, tenantId: string): Promise<Team> {
  const team = await prisma.team.findFirst({
    where: { tenantId },
  });

  if (!team) {
    throw new Error(`No teams found for tenant ${tenantId}`);
  }

  return team;
}
