import { ApiRateLimitError } from "@/lib/errors";

const WINDOW_MS = 60000;
const MAX_REQUESTS = 100;

// In-process fallback for local dev (no Redis env vars)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimitInProcess(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (now - record.windowStart >= WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  record.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  if (record.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining };
}

let redisRatelimit: {
  limit: (id: string) => Promise<{ success: boolean; remaining: number }>;
} | null = null;

async function getRedisRatelimit() {
  if (redisRatelimit) return redisRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");

    const redis = new Redis({ url, token });
    redisRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
      analytics: false,
    });
    return redisRatelimit;
  } catch {
    return null;
  }
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. " +
        "Falling back to in-process rate limiter. This is NOT safe for multi-instance deployments."
    );
    return checkRateLimitInProcess(userId);
  }

  const limiter = await getRedisRatelimit();
  if (!limiter) {
    return checkRateLimitInProcess(userId);
  }

  const result = await limiter.limit(userId);
  return { allowed: result.success, remaining: result.remaining };
}
