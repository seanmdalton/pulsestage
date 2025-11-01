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

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import { testPrisma } from '../test/setup.js';
import { Server } from 'http';
// @ts-expect-error - Package doesn't have TypeScript types
import { scan } from '@mdn/mdn-http-observatory';

describe('MDN HTTP Observatory Security Scan', () => {
  let server: Server;
  const TEST_PORT = 5555;
  const TEST_HOST = `localhost:${TEST_PORT}`;

  beforeAll(async () => {
    // Start Express app on test port
    const app = createApp(testPrisma);
    server = app.listen(TEST_PORT);

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Close server
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  });

  it('should pass MDN HTTP Observatory security scan', async () => {
    // Run Observatory scan against our local server root endpoint
    const result = await scan(TEST_HOST);

    console.log('\n MDN HTTP Observatory Results:');
    console.log(`   Grade: ${result.scan.grade}`);
    console.log(`   Score: ${result.scan.score}/100`);
    console.log(`   Tests Passed: ${result.scan.testsPassed}/${result.scan.testsQuantity}`);
    console.log(`   Tests Failed: ${result.scan.testsFailed}`);

    // In development mode (no HTTPS), we expect:
    // - CSP with unsafe-eval (for Vite HMR)
    // - No HSTS (requires HTTPS)
    // - No redirection (no HTTPS to redirect to)
    // Acceptable grade: C or better in dev
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // Development mode: expect C grade due to unsafe-eval and no HSTS
      expect(result.scan.score).toBeGreaterThanOrEqual(40);
      expect(result.scan.grade).toMatch(/^[ABC]/); // Accept C or better

      console.log('   ℹ  Development mode: relaxed CSP for Vite HMR');
    } else {
      // Production mode: expect A grade
      const acceptableGrades = ['A+', 'A', 'A-'];
      expect(acceptableGrades).toContain(result.scan.grade);
      expect(result.scan.score).toBeGreaterThanOrEqual(70);
    }

    // All tests should at least attempt to run
    expect(result.scan.testsQuantity).toBeGreaterThanOrEqual(8);
  }, 30000); // 30 second timeout for scan

  it('should have Content-Security-Policy implemented', async () => {
    const result = await scan(TEST_HOST);

    const cspTest = result.tests['content-security-policy'];
    expect(cspTest).toBeDefined();

    // In dev mode, CSP will have unsafe-eval (not ideal but needed for Vite)
    // In production, CSP should pass fully
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // CSP exists but may have unsafe-eval
      expect(cspTest.result).toContain('csp-implemented');
      console.log('\n CSP Test Result (dev mode):', cspTest.result);
    } else {
      // Production should have fully passing CSP
      expect(cspTest.pass).toBe(true);
      console.log('\n CSP Test Result (production):', cspTest.result);
    }
  }, 30000);

  it('should pass X-Content-Type-Options test', async () => {
    const result = await scan(TEST_HOST);

    const test = result.tests['x-content-type-options'];
    expect(test).toBeDefined();
    expect(test.pass).toBe(true);
  }, 30000);

  it('should pass X-Frame-Options test', async () => {
    const result = await scan(TEST_HOST);

    const test = result.tests['x-frame-options'];
    expect(test).toBeDefined();
    expect(test.pass).toBe(true);
  }, 30000);

  it('should pass Referrer-Policy test', async () => {
    const result = await scan(TEST_HOST);

    const test = result.tests['referrer-policy'];
    expect(test).toBeDefined();
    expect(test.pass).toBe(true);
  }, 30000);

  it('should provide detailed test results', async () => {
    const result = await scan(TEST_HOST);

    console.log('\n Detailed Test Results:');
    Object.entries(result.tests).forEach(([testName, testResult]: [string, any]) => {
      const status = testResult.pass ? '[OK]' : '[ERROR]';
      console.log(`   ${status} ${testName}: ${testResult.result}`);
    });

    // Ensure we have tests
    expect(Object.keys(result.tests).length).toBeGreaterThan(5);
  }, 30000);
});
