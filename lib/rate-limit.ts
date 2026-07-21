import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Use Redis.fromEnv() so the Edge-safe REST build is selected, consistent with
// middleware.ts. Avoids pulling the nodejs conditional export (process.version).
const redis = Redis.fromEnv();

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
