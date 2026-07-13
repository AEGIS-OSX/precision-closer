import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
});

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { success, limit, remaining, reset } = await ratelimit.limit(userId);

  return {
    allowed: success,
    remaining,
    resetAt: reset,
  };
}
