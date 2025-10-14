import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { tryGetTenantContext } from './tenantContext.js';
import { RATE_LIMITS, HTTP_STATUS, NETWORK } from '../constants.js';

let redisClient: RedisClientType | null = null;

// Get Redis connection status (for health checks)
export function getRedisStatus() {
  return {
    connected: redisClient?.isOpen || false,
    ready: redisClient?.isReady || false,
  };
}

// Initialize Redis client
export async function initRedis() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Skip Redis initialization in development
  if (!isProduction) {
    console.log('🚫 Rate limiting disabled in development environment');
    return;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || NETWORK.DEFAULT_REDIS_URL,
    });

    redisClient.on('error', err => console.error('Redis Client Error', err));

    await redisClient.connect();
    console.log('🔒 Redis connected for rate limiting (production mode)');
  } catch (error) {
    console.error('❌ Failed to connect to Redis for rate limiting:', error);

    // In production, Redis is REQUIRED for rate limiting (security critical)
    if (isProduction) {
      console.error('');
      console.error('🚨 CRITICAL: Redis connection failed in production!');
      console.error('   Rate limiting is a security requirement for production deployments.');
      console.error('   Please configure REDIS_URL and ensure Redis is accessible.');
      console.error('');
      throw new Error('Redis connection required for production rate limiting');
    }
  }
}

export function rateLimit(
  route: string,
  maxRequests: number = RATE_LIMITS.DEFAULT_REQUESTS_PER_MINUTE,
  windowMs: number = RATE_LIMITS.DEFAULT_WINDOW_MS
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development environment
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    // Skip rate limiting if Redis is not available
    if (!redisClient) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Include tenantId in rate limit key for per-tenant rate limiting
    const tenantContext = tryGetTenantContext();
    const tenantPart = tenantContext ? tenantContext.tenantId : 'no-tenant';
    const key = `rate:${route}:${tenantPart}:${ip}`;

    try {
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
        });
      }

      // Increment counter
      const newCount = count + 1;

      if (count === 0) {
        // First request - set with expiration
        await redisClient.set(key, newCount.toString(), {
          EX: Math.ceil(windowMs / RATE_LIMITS.MS_PER_SECOND),
        });
      } else {
        // Subsequent request - just increment
        await redisClient.set(key, newCount.toString(), {
          KEEPTTL: true,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Continue without rate limiting on error
      next();
    }
  };
}
