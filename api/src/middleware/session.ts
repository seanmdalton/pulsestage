import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import { env } from '../env.js';

// Create Redis client for sessions
let redisClient: ReturnType<typeof createClient> | null = null;

export async function initSessionStore() {
  try {
    redisClient = createClient({
      url: env.REDIS_URL
    });

    redisClient.on('error', (err) => {
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
    name: 'ama-admin-session',
    secret: env.ADMIN_KEY || 'fallback-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Allow HTTP cookies in development
      httpOnly: true, // Prevent XSS
      maxAge: 30 * 60 * 1000, // 30 minutes
      sameSite: 'lax', // CSRF protection but allow cross-site in dev
      domain: undefined // Let browser decide
    }
  };

  console.log(`🍪 Session config: secure=${sessionConfig.cookie?.secure}, sameSite=${sessionConfig.cookie?.sameSite}`);

  // Use Redis store if available, otherwise fall back to memory store
  if (redisClient) {
    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'ama-session:'
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
