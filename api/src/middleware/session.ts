import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { env } from '../env.js';

// Create Redis client for sessions
let redisClient: ReturnType<typeof createClient> | null = null;

// Get session store Redis status (for health checks)
export function getSessionRedisStatus() {
  return {
    connected: redisClient?.isOpen || false,
    ready: redisClient?.isReady || false,
  };
}

export async function initSessionStore() {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    redisClient = createClient({
      url: env.REDIS_URL,
    });

    redisClient.on('error', err => {
      console.warn('Redis session store error:', err);
    });

    await redisClient.connect();
    console.log('✅ Redis session store connected');
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis for session storage:', error);

    // In production, Redis is REQUIRED for session storage (prevents session loss on restarts)
    if (isProduction) {
      console.error('');
      console.error('🚨 CRITICAL: Redis connection failed in production!');
      console.error('   Session storage requires Redis in production to:');
      console.error('   - Persist sessions across application restarts');
      console.error('   - Enable horizontal scaling across multiple instances');
      console.error('   - Prevent user logouts during deployments');
      console.error('');
      console.error('   Please configure REDIS_URL and ensure Redis is accessible.');
      console.error('');
      throw new Error('Redis connection required for production session storage');
    }

    console.warn('⚠️  Redis session store failed to connect in development - using memory store');
    return null;
  }
}

export function createSessionMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';

  const sessionConfig: session.SessionOptions = {
    name: 'connect.sid', // Standard session cookie name for user sessions
    // Require SESSION_SECRET in production (enforced in env.ts). Allow fallback paths only in dev.
    secret: env.SESSION_SECRET || env.ADMIN_KEY || 'dev-only-fallback-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS-only in production, HTTP allowed in dev
      httpOnly: true, // Prevent XSS by blocking JavaScript access
      // Align cookie lifetime with configured policy (default 8h for admin; general user can be longer)
      // For now keep 24h for user sessions; admin routes enforce TTL separately
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax', // CSRF protection - allow cross-site GET but not POST
      domain: undefined, // Let browser decide
    },
  };

  console.log(
    `🍪 Session config: secure=${sessionConfig.cookie?.secure}, sameSite=${sessionConfig.cookie?.sameSite}, httpOnly=${sessionConfig.cookie?.httpOnly}`
  );

  // Use Redis store if available, otherwise fall back to memory store (dev only)
  if (redisClient) {
    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'ama-session:',
    });
  } else {
    if (isProduction) {
      // This should never happen due to initSessionStore() throwing in production,
      // but add as a fail-safe
      throw new Error('❌ Redis session store not initialized - cannot start in production mode');
    }
    console.warn('⚠️  Using memory session store (development mode only)');
  }

  return session(sessionConfig);
}

// Session type augmentation
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
    loginTime?: number;
  }
}
