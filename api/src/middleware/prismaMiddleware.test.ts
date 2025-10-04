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

import { describe, it, expect, beforeEach } from 'vitest';
import { testPrisma } from '../test/setup.js';
import { runInTenantContext } from './tenantContext.js';
import { applyTenantMiddleware } from './prismaMiddleware.js';

describe('prismaMiddleware', () => {
  let tenant1Id: string;
  let tenant2Id: string;

  beforeEach(async () => {
    // Apply middleware
    applyTenantMiddleware(testPrisma);

    // Create test tenants
    const tenant1 = await testPrisma.tenant.create({
      data: { slug: 'tenant1', name: 'Tenant 1' }
    });
    const tenant2 = await testPrisma.tenant.create({
      data: { slug: 'tenant2', name: 'Tenant 2' }
    });

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;
  });

  describe('data isolation', () => {
    it('should isolate team data between tenants', async () => {
      // Create teams in different tenants
      await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          await testPrisma.team.create({
            data: { name: 'Team A', slug: 'team-a', tenantId: tenant1Id }
          });
        }
      );

      await runInTenantContext(
        { tenantId: tenant2Id, tenantSlug: 'tenant2' },
        async () => {
          await testPrisma.team.create({
            data: { name: 'Team B', slug: 'team-b', tenantId: tenant2Id }
          });
        }
      );

      // Query from tenant1 - should only see tenant1's teams
      const teams1 = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.findMany();
        }
      );

      expect(teams1).toHaveLength(1);
      expect(teams1[0].name).toBe('Team A');
      expect(teams1[0].tenantId).toBe(tenant1Id);

      // Query from tenant2 - should only see tenant2's teams
      const teams2 = await runInTenantContext(
        { tenantId: tenant2Id, tenantSlug: 'tenant2' },
        async () => {
          return await testPrisma.team.findMany();
        }
      );

      expect(teams2).toHaveLength(1);
      expect(teams2[0].name).toBe('Team B');
      expect(teams2[0].tenantId).toBe(tenant2Id);
    });

    it('should isolate user data between tenants', async () => {
      // Create users in different tenants
      await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          await testPrisma.user.create({
            data: { 
              email: 'user1@tenant1.com', 
              name: 'User 1',
              tenantId: tenant1Id 
            }
          });
        }
      );

      await runInTenantContext(
        { tenantId: tenant2Id, tenantSlug: 'tenant2' },
        async () => {
          await testPrisma.user.create({
            data: { 
              email: 'user1@tenant2.com',
              name: 'User 1 (Tenant 2)',
              tenantId: tenant2Id 
            }
          });
        }
      );

      // Query from tenant1
      const users1 = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.user.findMany();
        }
      );

      expect(users1).toHaveLength(1);
      expect(users1[0].email).toBe('user1@tenant1.com');

      // Query from tenant2
      const users2 = await runInTenantContext(
        { tenantId: tenant2Id, tenantSlug: 'tenant2' },
        async () => {
          return await testPrisma.user.findMany();
        }
      );

      expect(users2).toHaveLength(1);
      expect(users2[0].email).toBe('user1@tenant2.com');
    });

    it('should prevent cross-tenant updates', async () => {
      // Create team in tenant1
      const team = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.create({
            data: { name: 'Team A', slug: 'team-a', tenantId: tenant1Id }
          });
        }
      );

      // Try to update from tenant2 - should not find the team
      await runInTenantContext(
        { tenantId: tenant2Id, tenantSlug: 'tenant2' },
        async () => {
          await expect(
            testPrisma.team.update({
              where: { id: team.id },
              data: { name: 'Hacked Name' }
            })
          ).rejects.toThrow();
        }
      );

      // Verify team name unchanged
      const verifyTeam = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.findUnique({
            where: { id: team.id }
          });
        }
      );

      expect(verifyTeam?.name).toBe('Team A');
    });

    it('should prevent cross-tenant deletes', async () => {
      // Create team in tenant1
      const team = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.create({
            data: { name: 'Team A', slug: 'team-a', tenantId: tenant1Id }
          });
        }
      );

      // Try to delete from tenant2 - should not find the team
      await runInTenantContext(
        { tenantId: tenant2Id, tenantSlug: 'tenant2' },
        async () => {
          await expect(
            testPrisma.team.delete({
              where: { id: team.id }
            })
          ).rejects.toThrow();
        }
      );

      // Verify team still exists
      const verifyTeam = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.findUnique({
            where: { id: team.id }
          });
        }
      );

      expect(verifyTeam).not.toBeNull();
    });
  });

  describe('automatic tenantId injection', () => {
    it('should automatically add tenantId on create', async () => {
      const team = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.create({
            data: { name: 'Team A', slug: 'team-a', tenantId: tenant1Id }
          });
        }
      );

      expect(team.tenantId).toBe(tenant1Id);
    });

    it('should automatically filter by tenantId on findMany', async () => {
      // Create data in both tenants
      await testPrisma.team.create({
        data: { name: 'Team 1', slug: 'team-1', tenantId: tenant1Id }
      });
      await testPrisma.team.create({
        data: { name: 'Team 2', slug: 'team-2', tenantId: tenant2Id }
      });

      // Query with tenant context
      const teams = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.findMany();
        }
      );

      expect(teams).toHaveLength(1);
      expect(teams[0].tenantId).toBe(tenant1Id);
    });

    it('should work with upsert operations', async () => {
      // First upsert - creates
      const team1 = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.upsert({
            where: { 
              tenantId_slug: { tenantId: tenant1Id, slug: 'team-a' }
            },
            create: { 
              name: 'Team A', 
              slug: 'team-a',
              tenantId: tenant1Id 
            },
            update: { name: 'Team A Updated' }
          });
        }
      );

      expect(team1.name).toBe('Team A');
      expect(team1.tenantId).toBe(tenant1Id);

      // Second upsert - updates
      const team2 = await runInTenantContext(
        { tenantId: tenant1Id, tenantSlug: 'tenant1' },
        async () => {
          return await testPrisma.team.upsert({
            where: { 
              tenantId_slug: { tenantId: tenant1Id, slug: 'team-a' }
            },
            create: { 
              name: 'Team A', 
              slug: 'team-a',
              tenantId: tenant1Id 
            },
            update: { name: 'Team A Updated' }
          });
        }
      );

      expect(team2.name).toBe('Team A Updated');
      expect(team2.id).toBe(team1.id);
    });
  });
});

