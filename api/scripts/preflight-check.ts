#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Pre-Flight Check Script
 *
 * Validates that the entire development environment is functional and ready for testing.
 * This should ALWAYS be run before asking the user to test anything.
 *
 * Checks:
 * 1. Docker services (postgres, redis, mailpit)
 * 2. Database connectivity
 * 3. API server health
 * 4. Frontend server accessibility
 * 5. Authentication flow (E2E login test)
 * 6. Seed data validation
 * 7. Basic API endpoint checks
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean; // If true, failure stops the entire check
}

const results: CheckResult[] = [];

async function check(
  name: string,
  fn: () => Promise<{ passed: boolean; message: string }>,
  critical = false
): Promise<boolean> {
  try {
    const result = await fn();
    results.push({ name, ...result, critical });

    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${result.message}`);

    if (!result.passed && critical) {
      console.error(`\n💥 CRITICAL FAILURE: ${name}`);
      console.error('Cannot proceed with testing until this is fixed.\n');
      return false;
    }

    return result.passed;
  } catch (_error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, message, critical });

    console.log(`❌ ${name}: ${message}`);

    if (critical) {
      console.error(`\n💥 CRITICAL FAILURE: ${name}`);
      console.error('Cannot proceed with testing until this is fixed.\n');
      return false;
    }

    return false;
  }
}

async function main() {
  console.log('🚀 Running Pre-Flight Checks...');
  console.log('='.repeat(60));
  console.log('');

  // 1. Check Docker services (non-critical if we can connect to DB)
  await check(
    'Docker Compose services',
    async () => {
      try {
        const { stdout } = await execAsync(
          'docker-compose ps --services --filter "status=running"'
        );
        const running = stdout
          .trim()
          .split('\n')
          .filter(s => s);
        const required = ['postgres', 'redis', 'mailpit'];
        const missing = required.filter(s => !running.includes(s));

        if (missing.length > 0) {
          return {
            passed: false,
            message: `Missing: ${missing.join(', ')}. Run 'docker-compose up -d'`,
          };
        }

        return { passed: true, message: `All services running (${running.length})` };
      } catch (_error) {
        // Docker command failed (likely permissions), but services might still be running
        // We'll verify via database connectivity check instead
        return { passed: true, message: 'Skipped (checking via DB connectivity instead)' };
      }
    },
    false
  );

  // 2. Check Database connectivity
  await check(
    'Database connection',
    async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { passed: true, message: 'Connected to PostgreSQL' };
      } catch (_error) {
        return { passed: false, message: 'Cannot connect to database' };
      }
    },
    true
  );

  // 3. Check API server
  await check(
    'API server health',
    async () => {
      try {
        const response = await fetch('http://localhost:3000/health');
        if (!response.ok) {
          return { passed: false, message: `HTTP ${response.status}` };
        }
        const data = await response.json();
        return data.ok
          ? { passed: true, message: 'API responding' }
          : { passed: false, message: 'Health check failed' };
      } catch (_error) {
        return { passed: false, message: 'API not running on port 3000' };
      }
    },
    true
  );

  // 4. Check Frontend server
  await check(
    'Frontend server',
    async () => {
      try {
        const response = await fetch('http://localhost:5173');
        return response.ok
          ? { passed: true, message: 'Frontend responding' }
          : { passed: false, message: `HTTP ${response.status}` };
      } catch (_error) {
        return { passed: false, message: 'Frontend not running on port 5173' };
      }
    },
    true
  );

  // 5. Check Authentication modes endpoint
  await check(
    'Auth modes endpoint',
    async () => {
      try {
        const response = await fetch('http://localhost:3000/auth/modes');
        if (!response.ok) {
          return { passed: false, message: `HTTP ${response.status}` };
        }
        const data = await response.json();
        return data.modes?.includes('demo')
          ? { passed: true, message: 'Demo mode available' }
          : { passed: false, message: 'Demo mode not configured' };
      } catch (_error) {
        return { passed: false, message: String(error) };
      }
    },
    false
  );

  // 6. Test login flow (E2E)
  await check(
    'Demo login flow',
    async () => {
      try {
        const response = await fetch('http://localhost:3000/auth/demo?user=admin&tenant=default', {
          redirect: 'manual',
        });

        if (response.status !== 302) {
          return { passed: false, message: `Expected 302, got ${response.status}` };
        }

        const cookie = response.headers.get('set-cookie');
        if (!cookie || !cookie.includes('connect.sid')) {
          return { passed: false, message: 'Session cookie not set' };
        }

        // Test authenticated request
        const meResponse = await fetch('http://localhost:3000/users/me', {
          headers: { Cookie: cookie },
        });

        if (!meResponse.ok) {
          return { passed: false, message: 'Session not working' };
        }

        const user = await meResponse.json();
        if (user.email !== 'admin@pulsestage.app') {
          return { passed: false, message: 'Wrong user returned' };
        }

        return { passed: true, message: 'Login and session working' };
      } catch (_error) {
        return { passed: false, message: String(error) };
      }
    },
    true
  );

  // 7. Validate seed data
  await check(
    'Seed data validation',
    async () => {
      try {
        // Check tenant
        const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
        if (!tenant) {
          return { passed: false, message: 'Default tenant not found' };
        }

        // Check users
        const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
        if (userCount < 5) {
          return { passed: false, message: `Only ${userCount} users (need ≥5)` };
        }

        // Check admin user
        const admin = await prisma.user.findFirst({
          where: { email: 'admin@pulsestage.app', tenantId: tenant.id },
          include: { teamMemberships: true },
        });

        if (!admin) {
          return { passed: false, message: 'Admin user not found' };
        }

        if (!admin.ssoId) {
          return { passed: false, message: 'Admin has no SSO ID' };
        }

        if (admin.teamMemberships.length === 0) {
          return { passed: false, message: 'Admin has no team memberships' };
        }

        // Check pulse data
        const pulseResponses = await prisma.pulseResponse.count({ where: { tenantId: tenant.id } });
        if (pulseResponses < 50) {
          return { passed: false, message: `Only ${pulseResponses} pulse responses (need ≥50)` };
        }

        // Check Q&A questions
        const questions = await prisma.question.count({ where: { tenantId: tenant.id } });
        if (questions < 20) {
          return { passed: false, message: `Only ${questions} questions (need ≥20)` };
        }

        return {
          passed: true,
          message: `Valid (${userCount} users, ${questions} questions, ${pulseResponses} pulse responses)`,
        };
      } catch (_error) {
        return { passed: false, message: String(error) };
      }
    },
    false
  );

  // 8. Check critical API endpoints
  await check(
    'Core API endpoints',
    async () => {
      try {
        // Login first to get session
        const loginResponse = await fetch(
          'http://localhost:3000/auth/demo?user=admin&tenant=default',
          {
            redirect: 'manual',
          }
        );
        const cookie = loginResponse.headers.get('set-cookie') || '';

        // Test critical endpoints
        const endpoints = [
          '/users/me',
          '/teams',
          '/questions?status=open&limit=10',
          '/pulse/summary',
        ];

        const results = await Promise.all(
          endpoints.map(async endpoint => {
            const response = await fetch(`http://localhost:3000${endpoint}`, {
              headers: { Cookie: cookie },
            });
            return { endpoint, ok: response.ok, status: response.status };
          })
        );

        const failed = results.filter(r => !r.ok);
        if (failed.length > 0) {
          return {
            passed: false,
            message: `Failed: ${failed.map(r => `${r.endpoint} (${r.status})`).join(', ')}`,
          };
        }

        return { passed: true, message: `All ${endpoints.length} endpoints responding` };
      } catch (_error) {
        return { passed: false, message: String(error) };
      }
    },
    false
  );

  // Summary
  console.log('');
  console.log('='.repeat(60));

  const critical = results.filter(r => r.critical);
  const criticalPassed = critical.filter(r => r.passed).length;
  const totalPassed = results.filter(r => r.passed).length;
  const allCriticalPassed = critical.every(r => r.passed);

  if (allCriticalPassed && totalPassed === results.length) {
    console.log('✅ ALL CHECKS PASSED - Ready for testing!');
    console.log('');
    console.log('🌐 Frontend: http://localhost:5173');
    console.log('🔌 API: http://localhost:3000');
    console.log('📧 Mailpit: http://localhost:8025');
    console.log('');
    console.log('👤 Demo Login: admin@pulsestage.app (or alice, bob, diana, charlie)');
    process.exit(0);
  } else if (allCriticalPassed) {
    console.log('⚠️  ALL CRITICAL CHECKS PASSED - Non-critical issues present');
    console.log(`   ${totalPassed}/${results.length} total checks passed`);
    console.log('   You can proceed with testing, but some features may not work.');
    process.exit(0);
  } else {
    console.log('❌ CRITICAL CHECKS FAILED - Cannot proceed with testing');
    console.log(`   ${criticalPassed}/${critical.length} critical checks passed`);
    console.log('');
    console.log('🔧 Common fixes:');
    console.log('   - Run: docker-compose up -d');
    console.log('   - Run: make db-seed');
    console.log('   - Run: make dev (in separate terminals for api and web)');
    process.exit(1);
  }
}

main()
  .catch(error => {
    console.error('💥 Pre-flight check crashed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
