import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.string().default('3000').transform(Number),
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
if (isProduction) {
  const missing: string[] = [];
  if (!parsed.SESSION_SECRET) missing.push('SESSION_SECRET');
  if (!parsed.CSRF_SECRET) missing.push('CSRF_SECRET');
  if (!parsed.ADMIN_KEY) missing.push('ADMIN_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }

  // CORS must not be wildcard when credentials are used
  const hasAllowlist = Array.isArray(parsed.CORS_ORIGINS) && parsed.CORS_ORIGINS.length > 0;
  if (!hasAllowlist || parsed.CORS_ORIGIN === '*') {
    throw new Error(
      'CORS_ORIGINS must be set to a comma-separated allowlist in production (no wildcard).'
    );
  }

  // Minimum secret length requirements (defense-in-depth)
  const tooShort: string[] = [];
  if (parsed.SESSION_SECRET && parsed.SESSION_SECRET.length < 32) tooShort.push('SESSION_SECRET');
  if (parsed.CSRF_SECRET && parsed.CSRF_SECRET.length < 32) tooShort.push('CSRF_SECRET');
  if (parsed.ADMIN_KEY && parsed.ADMIN_KEY.length < 32) tooShort.push('ADMIN_KEY');
  if (tooShort.length > 0) {
    throw new Error(
      `The following secrets are too short (min 32 chars): ${tooShort.join(', ')}`
    );
  }
}

export const env = parsed;

export type Env = z.infer<typeof envSchema>;
