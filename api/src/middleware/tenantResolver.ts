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

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { env } from '../env.js';
import { runInTenantContext, TenantContext } from './tenantContext.js';

// Extend Express Request to include tenant
declare module 'express-serve-static-core' {
  interface Request {
    tenant?: TenantContext;
  }
}

/**
 * Resolve tenant slug from request
 * Priority: Header > Subdomain > Default
 */
function resolveTenantSlug(req: Request): string {
  // 1. Check for tenant header (dev/test only by default, or when explicitly allowed)
  const headerTenant = req.headers[env.TENANT_HEADER.toLowerCase()] as string;
  const allowHeader = process.env.NODE_ENV !== 'production' || env.ALLOW_TENANT_HEADER;
  if (allowHeader && headerTenant) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Tenant resolved from header: ${headerTenant}`);
    }
    return headerTenant;
  }

  // 2. Check subdomain if multi-tenant mode is enabled
  if (env.MULTI_TENANT_MODE && env.BASE_DOMAIN) {
    const hostname = req.hostname || req.get('host')?.split(':')[0] || '';

    // Remove base domain to get subdomain
    if (hostname.endsWith(env.BASE_DOMAIN)) {
      const subdomain = hostname.slice(0, -(env.BASE_DOMAIN.length + 1)); // +1 for the dot

      if (subdomain && subdomain !== 'www') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Tenant resolved from subdomain: ${subdomain}`);
        }
        return subdomain;
      }
    }
  }

  // 3. Default to "default" tenant in single-tenant mode
  if (!env.MULTI_TENANT_MODE) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Tenant resolved to default (single-tenant mode)');
    }
    return 'default';
  }

  // 4. No tenant could be resolved in multi-tenant mode
  if (process.env.NODE_ENV === 'development') {
    console.log('❌ No tenant could be resolved in multi-tenant mode');
  }
  return '';
}

/**
 * Tenant resolver middleware
 * Resolves the current tenant and stores it in AsyncLocalStorage
 */
export function createTenantResolverMiddleware(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantSlug = resolveTenantSlug(req);

      // If no tenant slug in multi-tenant mode, return 404
      if (!tenantSlug) {
        return res.status(404).json({
          error: 'Tenant not found',
          message:
            'Unable to resolve tenant from request. Please specify tenant via subdomain or header.',
        });
      }

      // Look up tenant in database
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true, slug: true, name: true },
      });

      if (!tenant) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ Tenant not found in database: ${tenantSlug}`);
        }
        return res.status(404).json({
          error: 'Tenant not found',
          message: `Tenant '${tenantSlug}' does not exist.`,
        });
      }

      // Create tenant context
      const tenantContext: TenantContext = {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      };

      // Store in request for easy access
      req.tenant = tenantContext;

      // Run the rest of the request in tenant context
      runInTenantContext(tenantContext, () => {
        next();
      });
    } catch (error) {
      console.error('Tenant resolver error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to resolve tenant context',
      });
    }
  };
}
