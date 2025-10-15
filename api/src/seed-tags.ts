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

export async function seedTags() {
  console.log('🏷️  Seeding default tags...');

  try {
    // Ensure default tenant exists
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        slug: 'default',
        name: 'Default Organization',
      },
    });

    // Create "Currently Presenting" tag
    await prisma.tag.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Currently Presenting',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Currently Presenting',
        description: 'Question is currently being presented in presentation mode',
        color: '#10B981', // Green color
      },
    });

    console.log('✅ Default tags seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding tags:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTags()
    .catch(e => {
      console.error(e);
      throw e;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
