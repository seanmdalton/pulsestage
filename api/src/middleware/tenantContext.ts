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

import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

// AsyncLocalStorage for request-scoped tenant context
const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Get the current tenant context from AsyncLocalStorage
 * @throws Error if called outside of tenant context
 */
export function getTenantContext(): TenantContext {
  const context = tenantContextStorage.getStore();
  if (!context) {
    throw new Error('Tenant context not found. Ensure tenant resolver middleware is applied.');
  }
  return context;
}

/**
 * Try to get tenant context, returning undefined if not available
 */
export function tryGetTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore();
}

/**
 * Run a function within a tenant context
 */
export function runInTenantContext<T>(
  context: TenantContext,
  fn: () => T
): T {
  return tenantContextStorage.run(context, fn);
}

/**
 * Get the tenant context storage for testing purposes
 */
export function getTenantContextStorage() {
  return tenantContextStorage;
}

