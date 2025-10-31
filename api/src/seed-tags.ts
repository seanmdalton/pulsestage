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

    // Create default tags
    const defaultTags = [
      {
        name: 'Currently Presenting',
        description: 'Question is currently being presented in presentation mode',
        color: '#10B981',
      },
      {
        name: 'Feature Request',
        description: 'Suggestion for a new feature or improvement',
        color: '#3B82F6',
      },
      {
        name: 'Bug',
        description: 'Report of an issue or problem',
        color: '#EF4444',
      },
      {
        name: 'Question',
        description: 'General question or inquiry',
        color: '#8B5CF6',
      },
      {
        name: 'Process',
        description: 'Related to internal processes or procedures',
        color: '#F59E0B',
      },
      {
        name: 'Technical',
        description: 'Technical or engineering-related topic',
        color: '#06B6D4',
      },
    ];

    for (const tag of defaultTags) {
      await prisma.tag.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: tag.name,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          ...tag,
        },
      });
    }

    console.log(`✅ Default tags seeded successfully (${defaultTags.length} tags)`);
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
