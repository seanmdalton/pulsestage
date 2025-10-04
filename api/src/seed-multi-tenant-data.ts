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

export async function seedMultiTenantData() {
  console.log('🏢 Seeding multi-tenant test data...');

  // Create Acme Corp tenant
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      slug: 'acme',
      name: 'Acme Corp'
    }
  });
  console.log(`✅ Created tenant: ${acmeTenant.name} (${acmeTenant.slug})`);

  // Create teams for Acme
  const acmeEngineering = await prisma.team.upsert({
    where: { 
      tenantId_slug: { tenantId: acmeTenant.id, slug: 'engineering' }
    },
    update: {},
    create: {
      tenantId: acmeTenant.id,
      name: 'Engineering',
      slug: 'engineering',
      description: 'Engineering and development questions for Acme'
    }
  });

  const acmeProduct = await prisma.team.upsert({
    where: { 
      tenantId_slug: { tenantId: acmeTenant.id, slug: 'product' }
    },
    update: {},
    create: {
      tenantId: acmeTenant.id,
      name: 'Product',
      slug: 'product',
      description: 'Product and strategy questions for Acme'
    }
  });

  const acmeMarketing = await prisma.team.upsert({
    where: { 
      tenantId_slug: { tenantId: acmeTenant.id, slug: 'marketing' }
    },
    update: {},
    create: {
      tenantId: acmeTenant.id,
      name: 'Marketing',
      slug: 'marketing',
      description: 'Marketing and growth questions for Acme'
    }
  });

  console.log(`✅ Created teams: Engineering, Product, Marketing`);

  // Create test users for Acme
  const acmeUsers = [
    {
      email: 'alice.admin@acme.com',
      name: 'Alice Anderson',
      ssoId: 'alice.admin@acme.com',
      teams: [{ teamId: acmeEngineering.id, role: 'admin' }]
    },
    {
      email: 'charlie.owner@acme.com',
      name: 'Charlie Chen',
      ssoId: 'charlie.owner@acme.com',
      teams: [
        { teamId: acmeProduct.id, role: 'owner' },
        { teamId: acmeMarketing.id, role: 'admin' }
      ]
    },
    {
      email: 'emily.member@acme.com',
      name: 'Emily Evans',
      ssoId: 'emily.member@acme.com',
      teams: [
        { teamId: acmeEngineering.id, role: 'member' },
        { teamId: acmeProduct.id, role: 'member' }
      ]
    }
  ];

  for (const userData of acmeUsers) {
    const { teams, ...userInfo } = userData;
    
    const user = await prisma.user.upsert({
      where: { 
        tenantId_email: { tenantId: acmeTenant.id, email: userInfo.email }
      },
      update: {
        name: userInfo.name,
        ssoId: userInfo.ssoId
      },
      create: {
        ...userInfo,
        tenantId: acmeTenant.id
      }
    });

    console.log(`✅ Created user: ${user.name} (${user.email})`);

    // Create team memberships
    for (const membership of teams) {
      await prisma.teamMembership.upsert({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: membership.teamId
          }
        },
        update: { role: membership.role },
        create: {
          userId: user.id,
          teamId: membership.teamId,
          role: membership.role
        }
      });
    }
  }

  // Create sample questions for Acme
  const acmeQuestions = [
    {
      body: 'What is our cloud infrastructure strategy?',
      teamId: acmeEngineering.id,
      upvotes: 15
    },
    {
      body: 'How do we handle database scaling?',
      teamId: acmeEngineering.id,
      upvotes: 8
    },
    {
      body: 'What features are planned for Q2?',
      teamId: acmeProduct.id,
      upvotes: 22
    },
    {
      body: 'How do we measure product success?',
      teamId: acmeProduct.id,
      upvotes: 12,
      status: 'ANSWERED' as const,
      responseText: 'We track user engagement, retention, and revenue metrics.',
      respondedAt: new Date()
    },
    {
      body: 'What is our content marketing strategy?',
      teamId: acmeMarketing.id,
      upvotes: 18
    },
    {
      body: 'How do we approach social media?',
      teamId: acmeMarketing.id,
      upvotes: 6
    }
  ];

  for (const qData of acmeQuestions) {
    await prisma.question.create({
      data: {
        ...qData,
        tenantId: acmeTenant.id
      }
    });
  }

  console.log(`✅ Created ${acmeQuestions.length} questions for Acme`);
  console.log('🎉 Multi-tenant data seeding completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMultiTenantData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

