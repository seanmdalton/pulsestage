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

import { describe, it, expect } from 'vitest';
import {
  getTenantContext,
  tryGetTenantContext,
  runInTenantContext,
  TenantContext
} from './tenantContext.js';

describe('tenantContext', () => {
  const mockContext: TenantContext = {
    tenantId: 'test-tenant-id',
    tenantSlug: 'test-tenant'
  };

  describe('getTenantContext', () => {
    it('should throw error when called outside tenant context', () => {
      expect(() => getTenantContext()).toThrow('Tenant context not found');
    });

    it('should return context when called inside tenant context', () => {
      runInTenantContext(mockContext, () => {
        const context = getTenantContext();
        expect(context).toEqual(mockContext);
      });
    });
  });

  describe('tryGetTenantContext', () => {
    it('should return undefined when called outside tenant context', () => {
      const context = tryGetTenantContext();
      expect(context).toBeUndefined();
    });

    it('should return context when called inside tenant context', () => {
      runInTenantContext(mockContext, () => {
        const context = tryGetTenantContext();
        expect(context).toEqual(mockContext);
      });
    });
  });

  describe('runInTenantContext', () => {
    it('should execute function with tenant context', () => {
      const result = runInTenantContext(mockContext, () => {
        return getTenantContext().tenantSlug;
      });
      expect(result).toBe('test-tenant');
    });

    it('should isolate contexts between runs', () => {
      const context1: TenantContext = { tenantId: '1', tenantSlug: 'tenant1' };
      const context2: TenantContext = { tenantId: '2', tenantSlug: 'tenant2' };

      const result1 = runInTenantContext(context1, () => getTenantContext().tenantSlug);
      const result2 = runInTenantContext(context2, () => getTenantContext().tenantSlug);

      expect(result1).toBe('tenant1');
      expect(result2).toBe('tenant2');
    });

    it('should handle nested contexts', () => {
      const outer: TenantContext = { tenantId: 'outer', tenantSlug: 'outer-slug' };
      const inner: TenantContext = { tenantId: 'inner', tenantSlug: 'inner-slug' };

      runInTenantContext(outer, () => {
        expect(getTenantContext().tenantSlug).toBe('outer-slug');
        
        runInTenantContext(inner, () => {
          expect(getTenantContext().tenantSlug).toBe('inner-slug');
        });

        // Outer context restored
        expect(getTenantContext().tenantSlug).toBe('outer-slug');
      });
    });
  });
});

