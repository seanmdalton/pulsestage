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

export async function seedTestUsers() {
  console.log('👥 Seeding test users...');

  // Ensure default tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      id: 'default-tenant-id',
      slug: 'default',
      name: 'Default Tenant',
    },
  });
  console.log(`✅ Default tenant: ${tenant.name}`);

  // Get teams
  const engineeringTeam = await prisma.team.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'engineering' } },
  });

  const productTeam = await prisma.team.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'product' } },
  });

  // Create test users
  const users = [
    {
      email: 'john.doe@company.com',
      name: 'John Doe',
      ssoId: 'john.doe@company.com',
      teams: engineeringTeam ? [{ teamId: engineeringTeam.id, role: 'admin' }] : [],
    },
    {
      email: 'jane.smith@company.com',
      name: 'Jane Smith',
      ssoId: 'jane.smith@company.com',
      teams: engineeringTeam ? [{ teamId: engineeringTeam.id, role: 'member' }] : [],
    },
    {
      email: 'bob.wilson@company.com',
      name: 'Bob Wilson',
      ssoId: 'bob.wilson@company.com',
      teams: productTeam ? [{ teamId: productTeam.id, role: 'owner' }] : [],
    },
  ];

  for (const userData of users) {
    const { teams, ...userInfo } = userData;

    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: userInfo.email } },
      update: {
        name: userInfo.name,
        ssoId: userInfo.ssoId,
      },
      create: {
        ...userInfo,
        tenantId: tenant.id,
      },
    });

    console.log(`✅ Created/updated user: ${user.name} (${user.email})`);

    // Create team memberships
    for (const membership of teams) {
      await prisma.teamMembership.upsert({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: membership.teamId,
          },
        },
        update: {
          role: membership.role,
        },
        create: {
          userId: user.id,
          teamId: membership.teamId,
          role: membership.role,
        },
      });
      console.log(`  ✅ Added to team with role: ${membership.role}`);
    }
  }

  console.log('🎉 Test user seeding completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestUsers()
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
