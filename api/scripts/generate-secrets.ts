#!/usr/bin/env node
/**
 * Generate secure random secrets for production deployment
 *
 * Usage:
 *   npm run generate-secrets
 *   npm run generate-secrets --length 64
 *
 * Generates:
 *   - SESSION_SECRET (32+ characters)
 *   - CSRF_SECRET (32+ characters)
 *   - ADMIN_KEY (32+ characters)
 */

import { randomBytes } from 'crypto';

interface SecretConfig {
  name: string;
  length: number;
  description: string;
}

const secrets: SecretConfig[] = [
  {
    name: 'SESSION_SECRET',
    length: 64,
    description: 'Used to sign session cookies',
  },
  {
    name: 'CSRF_SECRET',
    length: 64,
    description: 'Used for CSRF token generation',
  },
  {
    name: 'ADMIN_KEY',
    length: 32,
    description: 'Admin API authentication key',
  },
];

function generateSecret(length: number): string {
  return randomBytes(length).toString('base64url').substring(0, length);
}

function generateSecrets() {
  console.log('');
  console.log('🔐 Generated Secure Secrets for Production');
  console.log('='.repeat(80));
  console.log('');
  console.log('⚠️  IMPORTANT: Store these in a secure secrets manager (e.g., HashiCorp Vault,');
  console.log('   AWS Secrets Manager, Azure Key Vault). Never commit to version control!');
  console.log('');
  console.log('-'.repeat(80));
  console.log('');

  secrets.forEach(({ name, length, description }) => {
    const secret = generateSecret(length);
    console.log(`# ${description}`);
    console.log(`${name}=${secret}`);
    console.log('');
  });

  console.log('-'.repeat(80));
  console.log('');
  console.log('📋 Next Steps:');
  console.log('  1. Copy these values to your production .env file or secrets manager');
  console.log('  2. Update your deployment configuration');
  console.log('  3. Restart your application');
  console.log('  4. Securely delete this terminal output');
  console.log('');
  console.log('🔒 Security Tips:');
  console.log('  • Never reuse secrets across environments');
  console.log('  • Rotate secrets periodically (recommended: every 90 days)');
  console.log('  • Use different secrets for each deployment environment');
  console.log('  • Enable audit logging for secret access');
  console.log('');
}

// Check for custom length argument
const args = process.argv.slice(2);
const lengthArg = args.find(arg => arg.startsWith('--length='));
if (lengthArg) {
  const customLength = parseInt(lengthArg.split('=')[1], 10);
  if (customLength >= 32) {
    secrets.forEach(s => (s.length = customLength));
  } else {
    console.error('❌ Error: Length must be at least 32 characters');
    process.exit(1);
  }
}

generateSecrets();
