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
import request from 'supertest';
import { testPrisma } from '../test/setup.js';
import { createApp } from '../app.js';

const app = createApp(testPrisma);

describe('Security Headers', () => {
  describe('Helmet Security Headers', () => {
    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should set Permissions-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['permissions-policy']).toBeDefined();
      expect(response.headers['permissions-policy']).toContain('camera=()');
      expect(response.headers['permissions-policy']).toContain('microphone=()');
      expect(response.headers['permissions-policy']).toContain('geolocation=()');
    });

    it('should set Cross-Origin-Opener-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
    });

    it('should set Cross-Origin-Resource-Policy header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
    });

    it('should hide X-Powered-By header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should set Origin-Agent-Cluster header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['origin-agent-cluster']).toBe('?1');
    });
  });

  describe('Content Security Policy', () => {
    it('should block inline scripts in production', async () => {
      const response = await request(app).get('/health');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toBeDefined();
      // Should not contain 'unsafe-inline' for scripts
      expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).not.toContain("script-src 'unsafe-inline'");
    });

    it('should set frame-ancestors to none', async () => {
      const response = await request(app).get('/health');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should set object-src to none', async () => {
      const response = await request(app).get('/health');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toContain("object-src 'none'");
    });

    it('should set base-uri to self', async () => {
      const response = await request(app).get('/health');
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toContain("base-uri 'self'");
    });
  });

  describe('Mozilla Observatory Requirements', () => {
    it('should have all required security headers', async () => {
      const response = await request(app).get('/health');
      
      // Core security headers for Observatory A grade
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['referrer-policy']).toBeDefined();
    });

    it('should not have insecure X-XSS-Protection header', async () => {
      const response = await request(app).get('/health');
      
      // Modern browsers ignore this, and it can cause issues
      // We explicitly set it to 0 in apiSecurityHeaders
      expect(response.headers['x-xss-protection']).not.toBe('1');
    });
  });

  describe('API Endpoints', () => {
    it('should apply security headers to API routes', async () => {
      const response = await request(app)
        .get('/questions')
        .set('x-tenant-id', 'default');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should apply security headers to admin routes', async () => {
      const response = await request(app)
        .get('/admin/audit')
        .set('x-tenant-id', 'default');
      
      // Will be 401 but headers should still be present
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});

