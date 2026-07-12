import { ApiRateLimitError } from "@/lib/errors";

const WINDOW_MS = 60000;
const MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// TODO(production): replace with Redis-backed rate limiter for multi-instance
export function checkRateLimit(userId: string): void {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return;
  }

  if (now - record.windowStart >= WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return;
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    throw new ApiRateLimitError();
  }
}
