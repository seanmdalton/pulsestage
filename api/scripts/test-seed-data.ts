#!/usr/bin/env tsx
/* eslint-disable no-process-exit */
/**
 * Seed Data Validation (Smoke Tests)
 * Validates that seed data is complete and correct
 * Run after seeding to ensure environment is ready for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, passed: boolean, message: string) {
  results.push({ test: name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function main() {
  console.log('🧪 Running Seed Data Validation Tests');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
    });
    test('Tenant exists', !!tenant, tenant ? `Found: ${tenant.name}` : 'Default tenant not found');

    if (!tenant) {
      throw new Error('Cannot proceed without tenant');
    }

    // Test 2: Users exist (4 login + 46 dummy = 50 total)
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
    });
    test('Users created', users.length >= 50, `Found ${users.length} users (expected ≥50)`);

    // Test 3: Users have team memberships
    const usersWithMemberships = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      include: { teamMemberships: true },
    });
    const usersWithoutTeams = usersWithMemberships.filter(u => u.teamMemberships.length === 0);
    test(
      'Users have team memberships',
      usersWithoutTeams.length === 0,
      usersWithoutTeams.length === 0
        ? 'All users assigned to teams'
        : `${usersWithoutTeams.length} users without teams: ${usersWithoutTeams.map(u => u.email).join(', ')}`
    );

    // Test 4: Admin user exists with admin role
    const adminMembership = await prisma.teamMembership.findFirst({
      where: {
        user: {
          tenantId: tenant.id,
          email: 'admin@pulsestage.app',
        },
        role: 'admin',
      },
      include: { user: true },
    });
    test(
      'Admin user has admin role',
      !!adminMembership,
      adminMembership ? 'Admin role assigned' : 'Admin role missing'
    );

    // Test 5: Teams exist (Engineering, Product)
    const teams = await prisma.team.findMany({
      where: { tenantId: tenant.id },
    });
    test('Teams created', teams.length >= 2, `Found ${teams.length} teams (expected ≥2)`);

    // Test 6: Tags exist
    const tags = await prisma.tag.findMany({
      where: { tenantId: tenant.id },
    });
    test('Tags created', tags.length >= 5, `Found ${tags.length} tags (expected ≥5)`);

    // Test 7: Pulse questions exist
    const pulseQuestions = await prisma.pulseQuestion.findMany({
      where: { tenantId: tenant.id, active: true },
    });
    test(
      'Pulse questions created',
      pulseQuestions.length >= 10,
      `Found ${pulseQuestions.length} active questions (expected ≥10)`
    );

    // Test 8: Pulse schedule exists and enabled
    const pulseSchedule = await prisma.pulseSchedule.findFirst({
      where: { tenantId: tenant.id },
    });
    test(
      'Pulse schedule configured',
      pulseSchedule?.enabled === true,
      pulseSchedule?.enabled
        ? 'Schedule enabled'
        : pulseSchedule
          ? 'Schedule exists but disabled'
          : 'No schedule found'
    );

    // Test 9: Pulse responses exist (historical data)
    // 12 weeks × 50 users × 2.5 questions × 80% participation ≈ 1200 responses
    const pulseResponses = await prisma.pulseResponse.findMany({
      where: { tenantId: tenant.id },
    });
    test(
      'Pulse historical data exists',
      pulseResponses.length >= 800,
      `Found ${pulseResponses.length} responses (expected ≥800)`
    );

    // Test 10: Pending pulse invites exist
    const pendingInvites = await prisma.pulseInvite.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ['PENDING', 'SENT'] },
      },
    });
    test(
      'Pending pulse invites exist',
      pendingInvites.length >= 5,
      `Found ${pendingInvites.length} pending invites (expected ≥5)`
    );

    // Test 11: Pulse invites have valid tokens
    const invitesWithoutTokens = pendingInvites.filter(inv => !inv.token);
    test(
      'Pulse invites have tokens',
      invitesWithoutTokens.length === 0,
      invitesWithoutTokens.length === 0
        ? 'All invites have tokens'
        : `${invitesWithoutTokens.length} invites missing tokens`
    );

    // Test 12: Tenant settings exist with pulse enabled
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });
    const settingsObj = settings?.settings as any;
    const pulseEnabled = settingsObj?.pulse?.enabled === true;
    test(
      'Pulse feature enabled',
      pulseEnabled,
      pulseEnabled ? 'Pulse enabled in settings' : 'Pulse not enabled'
    );

    // Test 13: Q&A questions exist
    const qaQuestions = await prisma.question.findMany({
      where: { tenantId: tenant.id },
    });
    test(
      'Q&A questions created',
      qaQuestions.length >= 20,
      `Found ${qaQuestions.length} questions (expected ≥20)`
    );

    // Test 14: Engineering team has sufficient questions
    const engineeringTeam = teams.find(t => t.slug === 'engineering');
    if (engineeringTeam) {
      const engOpen = await prisma.question.count({
        where: { teamId: engineeringTeam.id, status: 'OPEN' },
      });
      const engAnswered = await prisma.question.count({
        where: { teamId: engineeringTeam.id, status: 'ANSWERED' },
      });
      test(
        'Engineering team questions',
        engOpen >= 5 && engAnswered >= 5,
        `Found ${engOpen} open, ${engAnswered} answered (expected ≥5 each)`
      );
    }

    // Test 15: Product team has sufficient questions
    const productTeam = teams.find(t => t.slug === 'product');
    if (productTeam) {
      const productOpen = await prisma.question.count({
        where: { teamId: productTeam.id, status: 'OPEN' },
      });
      const productAnswered = await prisma.question.count({
        where: { teamId: productTeam.id, status: 'ANSWERED' },
      });
      test(
        'Product team questions',
        productOpen >= 5 && productAnswered >= 5,
        `Found ${productOpen} open, ${productAnswered} answered (expected ≥5 each)`
      );
    }

    // Test 17: Can authenticate as admin user (critical for testing)
    let loginSuccess = false;
    try {
      const adminUser = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          email: 'admin@pulsestage.app',
        },
        include: {
          teamMemberships: {
            include: {
              team: true,
            },
          },
        },
      });

      loginSuccess = !!(
        adminUser &&
        adminUser.ssoId === 'admin' &&
        adminUser.teamMemberships.length > 0 &&
        adminUser.teamMemberships.some(tm => tm.role === 'admin')
      );

      test(
        'Admin user can login (has SSO ID and team memberships)',
        loginSuccess,
        loginSuccess
          ? `Admin user ready with ${adminUser!.teamMemberships.length} team(s)`
          : 'Admin user missing SSO ID or team memberships'
      );
    } catch (err) {
      test(
        'Admin user can login (has SSO ID and team memberships)',
        false,
        `Error checking login: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // Test 18: All demo users have valid SSO IDs
    const usersWithoutSsoId = users.filter(u => !u.ssoId);
    test(
      'All users have SSO IDs for demo mode',
      usersWithoutSsoId.length === 0,
      usersWithoutSsoId.length === 0
        ? 'All users have SSO IDs'
        : `${usersWithoutSsoId.length} users missing SSO IDs: ${usersWithoutSsoId.map(u => u.email).join(', ')}`
    );

    // Test 19: Pulse cohorts exist
    const cohorts = await prisma.pulseCohort.findMany({
      where: { tenantId: tenant.id },
    });
    test(
      'Pulse cohorts created',
      cohorts.length >= 2,
      cohorts.length >= 2
        ? `Found ${cohorts.length} cohorts with ${cohorts.reduce((sum, c) => sum + c.userIds.length, 0)} total user assignments`
        : cohorts.length === 0
          ? 'No cohorts found'
          : `Only ${cohorts.length} cohort found (expected ≥2)`
    );

    // Test 20: API login endpoint works (E2E test)
    let apiLoginWorks = false;
    try {
      const loginResponse = await fetch('http://localhost:3000/auth/demo?user=admin&tenant=demo', {
        redirect: 'manual',
        credentials: 'include',
      });

      // Should redirect (302) and set a session cookie
      const hasSessionCookie = loginResponse.headers.get('set-cookie')?.includes('connect.sid');
      apiLoginWorks = loginResponse.status === 302 && !!hasSessionCookie;

      test(
        'API login endpoint works (E2E)',
        apiLoginWorks,
        apiLoginWorks
          ? `Login redirects properly with session cookie`
          : `Login failed: status ${loginResponse.status}, cookie: ${!!hasSessionCookie}`
      );
    } catch (err) {
      test(
        'API login endpoint works (E2E)',
        false,
        `Login API error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    console.log('');
    console.log('='.repeat(60));

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    if (failedTests === 0) {
      console.log(`✅ All ${totalTests} tests passed!`);
      console.log('');
      console.log('🎉 Seed data is valid and ready for testing!');
      process.exit(0);
    } else {
      console.log(`❌ ${failedTests} of ${totalTests} tests failed!`);
      console.log('');
      console.log('⚠️  Seed data has issues. Run: make db-seed');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
