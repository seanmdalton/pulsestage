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

/**
 * Migration Script: Require Primary Team for All Users
 *
 * This script migrates the database to enforce the team-first architecture:
 * 1. Creates "General" team for all tenants (if not exists)
 * 2. Assigns all users without primaryTeamId to General team
 * 3. Makes primaryTeamId field required (schema already updated)
 *
 * Run this BEFORE running `npx prisma migrate` or `npx prisma db push`
 */

import { PrismaClient } from '@prisma/client';
import { getOrCreateGeneralTeam } from '../src/lib/teams.js';

const prisma = new PrismaClient();

async function migrateRequirePrimaryTeam() {
  console.log('🔄 Migration: Require Primary Team for All Users');
  console.log('============================================================\n');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      console.log(`📦 Processing tenant: ${tenant.name} (${tenant.slug})`);

      // Step 1: Ensure General team exists
      const generalTeam = await getOrCreateGeneralTeam(prisma, tenant.id);
      console.log(`  ✅ General team ready: ${generalTeam.id}`);

      // Step 2: Count users without primaryTeamId
      const usersWithoutTeam = await prisma.user.count({
        where: {
          tenantId: tenant.id,
          primaryTeamId: null,
        },
      });

      if (usersWithoutTeam > 0) {
        console.log(`  🔄 Found ${usersWithoutTeam} user(s) without primary team`);

        // Step 3: Assign all users without primaryTeamId to General team
        const result = await prisma.user.updateMany({
          where: {
            tenantId: tenant.id,
            primaryTeamId: null,
          },
          data: {
            primaryTeamId: generalTeam.id,
          },
        });

        console.log(`  ✅ Assigned ${result.count} user(s) to General team`);
      } else {
        console.log(`  ✅ All users already have primary team`);
      }

      // Step 4: Verify all users now have teams
      const remainingWithoutTeam = await prisma.user.count({
        where: {
          tenantId: tenant.id,
          primaryTeamId: null,
        },
      });

      if (remainingWithoutTeam > 0) {
        throw new Error(`❌ Migration failed: ${remainingWithoutTeam} user(s) still without team`);
      }

      console.log(`  ✅ Verified: All users have primary team\n`);
    }

    console.log('============================================================');
    console.log('✅ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run: npx prisma db push');
    console.log('     (This will apply the schema change making primaryTeamId required)');
    console.log('  2. Restart API server');
    console.log('  3. Test OAuth login flow\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRequirePrimaryTeam()
    .then(() => console.log('Migration completed'))
    .catch(error => {
      console.error(error);
      throw error;
    });
}

export { migrateRequirePrimaryTeam };
