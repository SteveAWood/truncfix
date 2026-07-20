import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  lazyConnect: true,
});

// Prevent unhandled errors from crashing the process
redis.on('error', () => {
  // Fail open – we don't want Redis issues to take the site down
});

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Simple fixed-window rate limiter.
 * Returns success: false when the limit is exceeded.
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

    const redisKey = `rl:truncfix:${key}`;
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `${redisKey}:${Math.floor(now / windowSeconds)}`;

    const count = await redis.incr(windowKey);

    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    const remaining = Math.max(0, limit - count);
    const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

    return {
      success: count <= limit,
      remaining,
      reset,
    };
  } catch {
    // Fail open
    return { success: true, remaining: limit, reset: 0 };
  }
}