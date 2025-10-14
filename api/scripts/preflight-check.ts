#!/usr/bin/env node
/* eslint-disable no-process-exit, @typescript-eslint/no-explicit-any */
/**
 * Pre-flight check script for production deployments
 * Validates configuration and dependencies before deployment
 *
 * Usage:
 *   npm run preflight-check
 *   NODE_ENV=production npm run preflight-check
 */

import { createClient as createRedisClient } from 'redis';
import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];
let hasErrors = false;
let hasWarnings = false;

function checkPass(name: string, message: string, details?: string) {
  results.push({ name, status: 'pass', message, details });
  console.log(`✅ ${name}: ${message}`);
  if (details) console.log(`   ${details}`);
}

function checkWarn(name: string, message: string, details?: string) {
  results.push({ name, status: 'warn', message, details });
  hasWarnings = true;
  console.warn(`⚠️  ${name}: ${message}`);
  if (details) console.warn(`   ${details}`);
}

function checkFail(name: string, message: string, details?: string) {
  results.push({ name, status: 'fail', message, details });
  hasErrors = true;
  console.error(`❌ ${name}: ${message}`);
  if (details) console.error(`   ${details}`);
}

async function checkEnvironmentVariables() {
  console.log('\n🔐 Checking Environment Variables...\n');

  const requiredVars = ['DATABASE_URL', 'REDIS_URL', 'SESSION_SECRET', 'CSRF_SECRET', 'ADMIN_KEY'];

  const productionRequiredVars = ['CORS_ORIGINS'];

  // Check required vars
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      checkFail(varName, 'Missing required environment variable');
    } else {
      checkPass(varName, 'Set');
    }
  }

  // Production-specific requirements
  if (isProduction) {
    for (const varName of productionRequiredVars) {
      if (!process.env[varName]) {
        checkFail(varName, 'Missing required environment variable for production');
      } else {
        checkPass(varName, 'Set');
      }
    }

    // Check CORS not wildcard
    if (process.env.CORS_ORIGIN === '*') {
      checkFail('CORS_ORIGIN', 'Wildcard CORS not allowed in production');
    }

    // Check OAuth configured
    const hasGitHub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
    const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

    if (!hasGitHub && !hasGoogle) {
      checkFail(
        'OAuth',
        'At least one OAuth provider (GitHub or Google) must be configured in production'
      );
    } else {
      const providers: string[] = [];
      if (hasGitHub) providers.push('GitHub');
      if (hasGoogle) providers.push('Google');
      checkPass('OAuth', `Configured: ${providers.join(', ')}`);
    }
  }

  // Check secret strength
  const secrets = ['SESSION_SECRET', 'CSRF_SECRET', 'ADMIN_KEY'];
  for (const secretName of secrets) {
    const secret = process.env[secretName];
    if (secret) {
      if (secret.length < 32) {
        checkFail(`${secretName} Length`, `Too short (${secret.length} chars, need 32+)`);
      } else {
        checkPass(`${secretName} Length`, `${secret.length} characters`);
      }

      // Check for default values
      const dangerousDefaults = ['change-me', 'change-this', 'replace-me', 'example', 'test'];
      if (dangerousDefaults.some(def => secret.toLowerCase().includes(def))) {
        checkFail(`${secretName} Value`, 'Contains default/example text - must be changed!');
      } else {
        checkPass(`${secretName} Value`, 'Appears to be custom value');
      }
    }
  }

  // Check for localhost URLs in production
  if (isProduction) {
    const urlVars = ['DATABASE_URL', 'REDIS_URL', 'FRONTEND_URL'];
    for (const varName of urlVars) {
      const value = process.env[varName];
      if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
        checkWarn(varName, 'Contains localhost - verify this is correct for production');
      }
    }
  }
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  Checking Database Connection...\n');

  if (!process.env.DATABASE_URL) {
    checkFail('Database', 'DATABASE_URL not set');
    return;
  }

  const prisma = new PrismaClient();

  try {
    // Test connection
    const startTime = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;

    checkPass('Database Connection', `Connected in ${connectionTime}ms`);

    // Test query
    const queryStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - queryStart;

    checkPass('Database Query', `Query executed in ${queryTime}ms`);

    // Check connection pool info
    const poolInfo = await prisma.$queryRaw<Array<{ name: string; setting: string }>>`
      SELECT name, setting 
      FROM pg_settings 
      WHERE name IN ('max_connections', 'superuser_reserved_connections')
    `;

    const maxConnections =
      poolInfo.find((r: any) => r.name === 'max_connections')?.setting || 'unknown';
    checkPass('Database Pool', `Max connections: ${maxConnections}`);

    // Check if connection pool params in URL
    if (isProduction) {
      const hasPoolParams =
        process.env.DATABASE_URL.includes('connection_limit') ||
        process.env.DATABASE_URL.includes('pool_timeout');

      if (!hasPoolParams) {
        checkWarn(
          'Connection Pool',
          'No pool parameters in DATABASE_URL',
          'Consider adding: ?connection_limit=20&pool_timeout=60'
        );
      } else {
        checkPass('Connection Pool', 'Pool parameters configured');
      }
    }

    // Check for default credentials
    if (process.env.DATABASE_URL.includes(':app@') || process.env.DATABASE_URL.includes('/app:')) {
      checkWarn('Database Credentials', 'Appears to use default credentials (app:app)');
    }

    await prisma.$disconnect();
  } catch (error) {
    checkFail('Database', `Connection failed: ${(error as Error).message}`);
  }
}

async function checkRedisConnection() {
  console.log('\n🔴 Checking Redis Connection...\n');

  if (!process.env.REDIS_URL) {
    checkFail('Redis', 'REDIS_URL not set');
    return;
  }

  const client = createRedisClient({
    url: process.env.REDIS_URL,
  });

  try {
    const startTime = Date.now();
    await client.connect();
    const connectionTime = Date.now() - startTime;

    checkPass('Redis Connection', `Connected in ${connectionTime}ms`);

    // Test ping
    const pingStart = Date.now();
    const pong = await client.ping();
    const pingTime = Date.now() - pingStart;

    if (pong === 'PONG') {
      checkPass('Redis Ping', `Response in ${pingTime}ms`);
    } else {
      checkFail('Redis Ping', `Unexpected response: ${pong}`);
    }

    // Get memory info
    const info = await client.info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    if (memoryMatch) {
      checkPass('Redis Memory', `Using ${memoryMatch[1]}`);
    }

    // Check if Redis has persistence enabled (in production)
    if (isProduction) {
      const persistence = await client.info('persistence');
      const aofEnabled = persistence.includes('aof_enabled:1');
      const rdbEnabled = persistence.includes('rdb_last_save_time:');

      if (!aofEnabled && !rdbEnabled) {
        checkWarn(
          'Redis Persistence',
          'No persistence detected - sessions will be lost on restart'
        );
      } else {
        const method = aofEnabled ? 'AOF' : 'RDB';
        checkPass('Redis Persistence', `Enabled (${method})`);
      }
    }

    await client.disconnect();
  } catch (error) {
    if (isProduction) {
      checkFail('Redis', `Connection failed: ${(error as Error).message}`);
    } else {
      checkWarn('Redis', `Connection failed (OK in development): ${(error as Error).message}`);
    }
  }
}

async function checkNetworkConfiguration() {
  console.log('\n🌐 Checking Network Configuration...\n');

  // Check CORS
  const corsOrigins = process.env.CORS_ORIGINS;

  if (isProduction) {
    if (!corsOrigins) {
      checkFail('CORS', 'CORS_ORIGINS not set in production');
    } else if (corsOrigins.includes('*')) {
      checkFail('CORS', 'Wildcard not allowed in CORS_ORIGINS');
    } else {
      const origins = corsOrigins.split(',').map(s => s.trim());
      checkPass('CORS', `Configured for ${origins.length} origin(s)`);

      // Check if URLs are HTTPS
      const httpOrigins = origins.filter(o => o.startsWith('http://'));
      if (httpOrigins.length > 0) {
        checkWarn('CORS HTTPS', `Some origins use HTTP: ${httpOrigins.join(', ')}`);
      }
    }
  }

  // Check frontend URL
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    if (isProduction && frontendUrl.startsWith('http://')) {
      checkWarn('Frontend URL', 'Using HTTP in production - should use HTTPS');
    } else {
      checkPass('Frontend URL', 'Configured');
    }
  }
}

async function checkOptionalServices() {
  console.log('\n📧 Checking Optional Services...\n');

  // Email configuration
  const emailProvider = process.env.EMAIL_PROVIDER;
  if (emailProvider) {
    checkPass('Email Provider', `Configured: ${emailProvider}`);

    if (emailProvider === 'smtp') {
      if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        checkPass('SMTP', 'Configuration present');
      } else {
        checkWarn('SMTP', 'EMAIL_PROVIDER is smtp but SMTP credentials missing');
      }
    } else if (emailProvider === 'resend') {
      if (process.env.RESEND_API_KEY) {
        checkPass('Resend', 'API key configured');
      } else {
        checkWarn('Resend', 'EMAIL_PROVIDER is resend but RESEND_API_KEY missing');
      }
    }
  } else {
    checkWarn('Email', 'Not configured - email notifications will not be sent');
  }

  // OpenAI moderation (optional)
  if (process.env.OPENAI_API_KEY) {
    checkPass('OpenAI Moderation', 'API key configured');
  } else {
    console.log('ℹ️  OpenAI Moderation: Not configured (using local filtering only)');
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRE-FLIGHT CHECK SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (hasErrors) {
    console.error('🚨 DEPLOYMENT BLOCKED - Fix errors before deploying!\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('⚠️  WARNINGS DETECTED - Review before deploying\n');
    if (isProduction) {
      console.warn('Continue with deployment? (y/N)');
      // In CI/CD, you might want to fail here too
    }
    process.exit(0);
  } else {
    console.log('✅ ALL CHECKS PASSED - Ready for deployment!\n');
    process.exit(0);
  }
}

async function main() {
  console.log('🚀 Running Pre-Flight Checks for Production Deployment\n');
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    await checkEnvironmentVariables();
    await checkDatabaseConnection();
    await checkRedisConnection();
    await checkNetworkConfiguration();
    await checkOptionalServices();
  } catch (error) {
    console.error('\n❌ Pre-flight check failed with error:', error);
    process.exit(1);
  }

  await printSummary();
}

main();
