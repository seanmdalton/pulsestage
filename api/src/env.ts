import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.string().default('3000').transform(Number),
  // Production secrets must be at least 32 characters for security
  ADMIN_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  CSRF_SECRET: z.string().optional(),

  // CORS configuration
  // Back-compat: keep single origin while supporting allowlists via CORS_ORIGINS
  CORS_ORIGIN: z.string().default('*'),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform(v =>
      v
        ? v
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined
    ),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Multi-tenancy configuration
  MULTI_TENANT_MODE: z
    .string()
    .default('false')
    .transform(val => val === 'true'),
  BASE_DOMAIN: z.string().optional(), // e.g., 'pulsestage.com' for subdomain tenant resolution
  TENANT_HEADER: z.string().default('x-tenant-id'), // Header for tenant override (dev/test)
  ALLOW_TENANT_HEADER: z
    .string()
    .default('false')
    .transform(v => v === 'true'),

  // Rate limiting / Redis requirements
  REQUIRE_REDIS: z
    .string()
    .default('false')
    .transform(v => v === 'true'),
  ENABLE_INMEMORY_RATE_LIMIT_FALLBACK: z
    .string()
    .default('false')
    .transform(v => v === 'true'),

  // SSE configuration
  SSE_HEARTBEAT_INTERVAL: z.string().default('30000').transform(Number), // milliseconds
});

const parsed = envSchema.parse(process.env);

// Production safeguards: enforce required secrets and sane CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
const MIN_SECRET_LENGTH = 32;

if (isProduction) {
  const missing: string[] = [];
  const weak: string[] = [];

  // Check for missing secrets
  if (!parsed.SESSION_SECRET) missing.push('SESSION_SECRET');
  if (!parsed.CSRF_SECRET) missing.push('CSRF_SECRET');
  if (!parsed.ADMIN_KEY) missing.push('ADMIN_KEY');

  if (missing.length > 0) {
    throw new Error(
      `[ERROR] Missing required environment variables in production: ${missing.join(', ')}\n` +
        `   Run 'npm run generate-secrets' to create secure random secrets.`
    );
  }

  // Check for weak/default secrets (minimum length enforcement)
  if (parsed.SESSION_SECRET && parsed.SESSION_SECRET.length < MIN_SECRET_LENGTH) {
    weak.push(`SESSION_SECRET (${parsed.SESSION_SECRET.length} chars, need ${MIN_SECRET_LENGTH}+)`);
  }
  if (parsed.CSRF_SECRET && parsed.CSRF_SECRET.length < MIN_SECRET_LENGTH) {
    weak.push(`CSRF_SECRET (${parsed.CSRF_SECRET.length} chars, need ${MIN_SECRET_LENGTH}+)`);
  }
  if (parsed.ADMIN_KEY && parsed.ADMIN_KEY.length < MIN_SECRET_LENGTH) {
    weak.push(`ADMIN_KEY (${parsed.ADMIN_KEY.length} chars, need ${MIN_SECRET_LENGTH}+)`);
  }

  // Check for default/example secrets
  const dangerousDefaults = [
    'change-me',
    'change-this',
    'replace-me',
    'example',
    'test',
    'dev',
    'development',
    'production',
  ];
  const secretsToCheck = [
    { name: 'SESSION_SECRET', value: parsed.SESSION_SECRET },
    { name: 'CSRF_SECRET', value: parsed.CSRF_SECRET },
    { name: 'ADMIN_KEY', value: parsed.ADMIN_KEY },
  ];

  secretsToCheck.forEach(({ name, value }) => {
    if (value && dangerousDefaults.some(def => value.toLowerCase().includes(def))) {
      weak.push(`${name} (contains default/example text)`);
    }
  });

  if (weak.length > 0) {
    throw new Error(
      `[ERROR] Weak or default secrets detected in production:\n` +
        `   ${weak.join('\n   ')}\n\n` +
        `   Run 'npm run generate-secrets' to create secure random secrets.`
    );
  }

  // CORS must not be wildcard when credentials are used
  const hasAllowlist = Array.isArray(parsed.CORS_ORIGINS) && parsed.CORS_ORIGINS.length > 0;
  if (!hasAllowlist || parsed.CORS_ORIGIN === '*') {
    throw new Error(
      '[ERROR] CORS_ORIGINS must be set to a comma-separated allowlist in production (no wildcard).\n' +
        '   Example: CORS_ORIGINS=https://app.example.com,https://www.example.com'
    );
  }

  // Validate REDIS_URL is not using default localhost in production
  if (parsed.REDIS_URL.includes('localhost') || parsed.REDIS_URL.includes('127.0.0.1')) {
    console.warn(
      '[WARNING]  WARNING: REDIS_URL appears to use localhost in production.\n' +
        '   Ensure this is correct for your deployment environment.'
    );
  }

  // Validate DATABASE_URL is not using default credentials
  if (
    parsed.DATABASE_URL.includes('postgres://app:app@') ||
    parsed.DATABASE_URL.includes('password=app')
  ) {
    console.warn(
      '[WARNING]  WARNING: DATABASE_URL appears to use default credentials.\n' +
        '   Ensure you have changed the default database password!'
    );
  }
}

export const env = parsed;

export type Env = z.infer<typeof envSchema>;
