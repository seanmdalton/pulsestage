import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

// Initialize Redis client
export async function initRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379'
    });
    
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    
    await redisClient.connect();
    console.log('Redis connected for rate limiting');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Continue without rate limiting if Redis is unavailable
  }
}

export function rateLimit(route: string, maxRequests: number = 10, windowMs: number = 60000) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if Redis is not available
    if (!redisClient) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate:${route}:${ip}`;
    
    try {
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        return res.status(429).json({ 
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`
        });
      }

      // Increment counter
      const newCount = count + 1;
      
      if (count === 0) {
        // First request - set with expiration
        await redisClient.set(key, newCount.toString(), {
          EX: Math.ceil(windowMs / 1000)
        });
      } else {
        // Subsequent request - just increment
        await redisClient.set(key, newCount.toString(), {
          KEEPTTL: true
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
