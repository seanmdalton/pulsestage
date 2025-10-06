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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Adding moderator test users...');

  // Get default tenant
  const defaultTenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
  });

  if (!defaultTenant) {
    console.error('❌ Default tenant not found');
    return;
  }

  // Get all teams in default tenant
  const teams = await prisma.team.findMany({
    where: { tenantId: defaultTenant.id },
  });

  if (teams.length === 0) {
    console.error('❌ No teams found in default tenant');
    return;
  }

  // Create moderator users for default tenant
  const moderators = [
    {
      email: 'sarah@example.com',
      name: 'Sarah Wilson',
      ssoId: 'sarah-123',
      teams: [teams[0].id, teams[1]?.id].filter(Boolean), // Engineering and Product teams
    },
    {
      email: 'mike@example.com',
      name: 'Mike Chen',
      ssoId: 'mike-456',
      teams: [teams[2]?.id, teams[3]?.id].filter(Boolean), // Design and Marketing teams
    },
  ];

  for (const mod of moderators) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: defaultTenant.id,
          email: mod.email,
        },
      },
    });

    if (existingUser) {
      console.log(`⏭️  User ${mod.email} already exists, skipping...`);
      continue;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: defaultTenant.id,
        email: mod.email,
        name: mod.name,
        ssoId: mod.ssoId,
      },
    });

    // Add team memberships with moderator role
    for (const teamId of mod.teams) {
      await prisma.teamMembership.create({
        data: {
          userId: user.id,
          teamId: teamId,
          role: 'moderator',
        },
      });
    }

    console.log(`✅ Created moderator: ${mod.name} (${mod.email})`);
  }

  // Get Acme Corp tenant
  const acmeTenant = await prisma.tenant.findUnique({
    where: { slug: 'acme' },
  });

  if (acmeTenant) {
    const acmeTeams = await prisma.team.findMany({
      where: { tenantId: acmeTenant.id },
    });

    if (acmeTeams.length > 0) {
      // Add one moderator for Acme Corp
      const acmeModerator = {
        email: 'david@acme.com',
        name: 'David Martinez',
        ssoId: 'david-acme-789',
        teams: [acmeTeams[0].id], // First team
      };

      const existingAcmeUser = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: acmeTenant.id,
            email: acmeModerator.email,
          },
        },
      });

      if (!existingAcmeUser) {
        const acmeUser = await prisma.user.create({
          data: {
            tenantId: acmeTenant.id,
            email: acmeModerator.email,
            name: acmeModerator.name,
            ssoId: acmeModerator.ssoId,
          },
        });

        await prisma.teamMembership.create({
          data: {
            userId: acmeUser.id,
            teamId: acmeModerator.teams[0],
            role: 'moderator',
          },
        });

        console.log(`✅ Created Acme moderator: ${acmeModerator.name} (${acmeModerator.email})`);
      } else {
        console.log(`⏭️  Acme user ${acmeModerator.email} already exists, skipping...`);
      }
    }
  }

  console.log('🎉 Moderator users seeded successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error seeding moderators:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
