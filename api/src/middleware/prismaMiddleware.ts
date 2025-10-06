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

import { Prisma } from '@prisma/client';
import { tryGetTenantContext } from './tenantContext.js';

/**
 * Models that are scoped by tenantId
 */
const TENANT_SCOPED_MODELS = new Set(['Team', 'Question', 'Tag', 'User', 'UserPreferences']);

/**
 * Check if a model requires tenant scoping
 */
function isTenantScoped(model: string | undefined): boolean {
  return model ? TENANT_SCOPED_MODELS.has(model) : false;
}

/**
 * Prisma middleware to automatically scope queries by tenantId
 *
 * This middleware ensures complete tenant isolation by:
 * - Injecting tenantId into all WHERE clauses for reads
 * - Adding tenantId to all CREATE operations
 * - Enforcing tenantId match on UPDATE and DELETE operations
 */
export function createTenantScopingMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action } = params;

    // Skip if model doesn't require tenant scoping
    if (!isTenantScoped(model)) {
      return next(params);
    }

    // Get current tenant context
    const tenantContext = tryGetTenantContext();

    // If no tenant context, allow the query (for migrations, seeds, etc.)
    if (!tenantContext) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  Prisma query on ${model} without tenant context:`, action);
      }
      return next(params);
    }

    const { tenantId } = tenantContext;

    // Handle different query actions
    switch (action) {
      // READ operations - inject tenantId into where clause
      case 'findUnique':
      case 'findUniqueOrThrow':
      case 'findFirst':
      case 'findFirstOrThrow':
      case 'findMany':
      case 'count':
      case 'aggregate':
      case 'groupBy':
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        params.args.where.tenantId = tenantId;
        break;

      // CREATE operations - inject tenantId into data
      case 'create':
        params.args = params.args || {};
        params.args.data = params.args.data || {};
        params.args.data.tenantId = tenantId;
        break;

      case 'createMany':
        params.args = params.args || {};
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((record: any) => ({
            ...record,
            tenantId,
          }));
        }
        break;

      // UPDATE operations - enforce tenantId in where clause
      case 'update':
      case 'updateMany':
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        params.args.where.tenantId = tenantId;
        break;

      // UPSERT operations - inject tenantId into both create and where
      case 'upsert':
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        params.args.where.tenantId = tenantId;
        params.args.create = params.args.create || {};
        params.args.create.tenantId = tenantId;
        // Note: update doesn't need tenantId since it's matched by where
        break;

      // DELETE operations - enforce tenantId in where clause
      case 'delete':
      case 'deleteMany':
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        params.args.where.tenantId = tenantId;
        break;
    }

    return next(params);
  };
}

/**
 * Apply tenant scoping middleware to a Prisma client instance
 */
export function applyTenantMiddleware(prisma: any) {
  prisma.$use(createTenantScopingMiddleware());

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Tenant scoping middleware applied to Prisma client');
  }
}
