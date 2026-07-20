import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  lazyConnect: true,
});

// Prevent Redis errors from crashing the process
redis.on('error', () => {});

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * Simple fixed-window rate limiter.
 * Fails open (allows the request) if Redis is unavailable.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    if (redis.status !== 'ready') {
      await redis.connect().catch(() => null);
    }

    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds);
    const redisKey = `rl:truncfix:${key}:${window}`;

    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch {
    // Fail open – never take the site down because of Redis
    return { success: true, remaining: limit };
  }
}