import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

// In-process fallback for local dev when Redis env vars are absent
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
  const allowed = record.count <= MAX_REQUESTS;
  return { allowed, remaining };
}

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
    prefix: "rl:precision-closer",
  });

  return ratelimit;
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const rl = getRatelimit();

  if (!rl) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL not set -- falling back to in-process rate limiter. " +
        "This is NOT safe for multi-instance deployments."
    );
    return checkRateLimitInProcess(userId);
  }

  const { success, remaining } = await rl.limit(userId);
  return { allowed: success, remaining };
}
