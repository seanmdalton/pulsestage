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

/**
 * Get or create the "General" team for a tenant.
 *
 * The General team is the default team for all users and is created automatically
 * when a tenant is created. It serves as the initial team assignment for OAuth users
 * before they select their actual team.
 *
 * @param prisma - Prisma client instance
 * @param tenantId - Tenant ID
 * @returns The General team
 */
export async function getOrCreateGeneralTeam(
  prisma: PrismaClient,
  tenantId: string
): Promise<Team> {
  // Try to find existing General team
  let generalTeam = await prisma.team.findFirst({
    where: {
      tenantId,
      slug: 'general',
    },
  });

  // Create if doesn't exist
  if (!generalTeam) {
    generalTeam = await prisma.team.create({
      data: {
        tenantId,
        name: 'General',
        slug: 'general',
        description: 'Default team for all users',
        isActive: true,
      },
    });
  }

  return generalTeam;
}

/**
 * Ensure the General team exists for a tenant.
 * This should be called during tenant creation or initialization.
 *
 * @param prisma - Prisma client instance
 * @param tenantId - Tenant ID
 */
export async function ensureGeneralTeamExists(
  prisma: PrismaClient,
  tenantId: string
): Promise<void> {
  await getOrCreateGeneralTeam(prisma, tenantId);
}
