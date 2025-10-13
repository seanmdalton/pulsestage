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
    console.warn('⚠️  Redis session store failed to connect:', error);
    return null;
  }
}

export function createSessionMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';

  const sessionConfig: session.SessionOptions = {
    name: 'connect.sid', // Standard session cookie name for user sessions
    secret: env.SESSION_SECRET || env.ADMIN_KEY || 'fallback-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS-only in production, HTTP allowed in dev
      httpOnly: true, // Prevent XSS by blocking JavaScript access
      maxAge: 24 * 60 * 60 * 1000, // 24 hours for user sessions
      sameSite: 'lax', // CSRF protection - allow cross-site GET but not POST
      domain: undefined, // Let browser decide
    },
  };

  console.log(
    `🍪 Session config: secure=${sessionConfig.cookie?.secure}, sameSite=${sessionConfig.cookie?.sameSite}, httpOnly=${sessionConfig.cookie?.httpOnly}`
  );

  // Use Redis store if available, otherwise fall back to memory store
  if (redisClient) {
    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'ama-session:',
    });
  } else {
    console.warn('⚠️  Using memory session store (not recommended for production)');
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
