import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { tryGetTenantContext } from './tenantContext.js';
import { RATE_LIMITS, HTTP_STATUS, NETWORK } from '../constants.js';

let redisClient: RedisClientType | null = null;

// ----------------------------------------------------------------------------
// In-memory fallback rate limiter (used only when Redis is unavailable)
// ----------------------------------------------------------------------------
type Bucket = { count: number; resetAt: number };
const fallbackBuckets: Map<string, Bucket> = new Map();
let lastFallbackLogAt = 0;

function takeFromFallbackBucket(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = fallbackBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    // New window
    fallbackBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count < maxRequests) {
    existing.count += 1;
    return true;
  }

  return false;
}

// Get Redis connection status (for health checks)
export function getRedisStatus() {
  return {
    connected: redisClient?.isOpen || false,
    ready: redisClient?.isReady || false,
  };
}

// Initialize Redis client
export async function initRedis() {
  // Skip Redis initialization in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚫 Rate limiting disabled outside production environment');
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
    console.error('Failed to connect to Redis:', error);
    // Continue with in-memory fallback rate limiting
  }
}

export function rateLimit(
  route: string,
  maxRequests: number = RATE_LIMITS.DEFAULT_REQUESTS_PER_MINUTE,
  windowMs: number = RATE_LIMITS.DEFAULT_WINDOW_MS
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting outside production (development/test)
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // When Redis is unavailable, use a conservative in-memory fallback limiter
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const tenantContext = tryGetTenantContext();
    const tenantPart = tenantContext ? tenantContext.tenantId : 'no-tenant';
    const key = `rate:${route}:${tenantPart}:${ip}`;

    if (!redisClient) {
      const allowed = takeFromFallbackBucket(
        key,
        Math.min(maxRequests, 5),
        Math.min(windowMs, 60_000)
      );
      if (!allowed) {
        // Log a periodic warning (at most once per 60s) to avoid log spam
        const now = Date.now();
        if (now - lastFallbackLogAt > 60_000) {
          lastFallbackLogAt = now;
          console.warn(
            '⚠️  Rate limit fallback active (Redis unavailable) — applying conservative limits'
          );
        }

        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please retry later.`,
          degradedProtection: true,
        });
      }
      return next();
    }

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
