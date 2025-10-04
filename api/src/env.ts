import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.string().default('3000').transform(Number),
  ADMIN_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Multi-tenancy configuration
  MULTI_TENANT_MODE: z.string().default('false').transform(val => val === 'true'),
  BASE_DOMAIN: z.string().optional(), // e.g., 'pulsestage.com' for subdomain tenant resolution
  TENANT_HEADER: z.string().default('x-tenant-id'), // Header for tenant override (dev/test)
  
  // SSE configuration
  SSE_HEARTBEAT_INTERVAL: z.string().default('30000').transform(Number), // milliseconds
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;

