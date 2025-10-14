/**
 * Database configuration and initialization
 * Configures Prisma Client with production-ready settings
 */

import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Create and configure Prisma Client with appropriate settings for the environment
 */
export function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: isProduction
      ? [
          // Production logging: Errors and slow queries only
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
          {
            emit: 'event',
            level: 'query', // Log slow queries for performance monitoring
          },
        ]
      : [
          // Development logging: Everything for debugging
          { emit: 'stdout', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ],
  });

  // Log slow queries in production (> 1 second)
  if (isProduction) {
    client.$on('query', (e: any) => {
      if (e.duration > 1000) {
        console.warn(`⚠️  Slow query detected (${e.duration}ms):`, {
          query: e.query,
          params: e.params,
          duration: e.duration,
        });
      }
    });

    client.$on('error', (e: any) => {
      console.error('❌ Database error:', e);
    });
  }

  return client;
}

/**
 * Validate database connection and log connection pool info
 */
export async function validateDatabaseConnection(client: PrismaClient): Promise<void> {
  try {
    // Test connection
    await client.$connect();

    // Query pool stats
    const result = await client.$queryRaw<Array<{ setting: string; value: string }>>`
      SELECT 
        name as setting,
        setting as value
      FROM pg_settings 
      WHERE name IN ('max_connections', 'superuser_reserved_connections')
    `;

    const maxConnections = result.find(r => r.setting === 'max_connections')?.value || 'unknown';
    const reservedConnections =
      result.find(r => r.setting === 'superuser_reserved_connections')?.value || 'unknown';

    console.log('📊 Database connection pool info:');
    console.log(`   Max connections (database): ${maxConnections}`);
    console.log(`   Reserved connections: ${reservedConnections}`);

    // Get active connections
    const activeConnections = await client.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()
    `;

    console.log(`   Active connections: ${activeConnections[0]?.count || 0}`);

    // Production warnings
    if (isProduction) {
      const dbUrl = process.env.DATABASE_URL || '';

      // Check if connection pool parameters are set
      const hasPoolParams = dbUrl.includes('connection_limit') || dbUrl.includes('pool_timeout');

      if (!hasPoolParams) {
        console.warn('');
        console.warn('⚠️  WARNING: No connection pool parameters detected in DATABASE_URL');
        console.warn('   For production, consider adding:');
        console.warn('   ?connection_limit=20&pool_timeout=60&connect_timeout=10');
        console.warn('');
      }

      // Check for default credentials
      if (dbUrl.includes(':app@') || dbUrl.includes('/app:')) {
        console.warn('');
        console.warn('⚠️  WARNING: Default database credentials detected!');
        console.warn('   Please change default username/password for security.');
        console.warn('');
      }
    }

    console.log('✅ Database connection validated');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler for database connection
 */
export async function shutdownDatabase(client: PrismaClient): Promise<void> {
  console.log('🔌 Disconnecting from database...');
  await client.$disconnect();
  console.log('✅ Database disconnected');
}
