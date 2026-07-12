import { ApiRateLimitError } from "./errors";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

// TODO(production): replace with Redis-backed rate limiter for multi-instance
export function checkRateLimit(userId: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return;
  }

  if (now - entry.windowStart >= WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    throw new ApiRateLimitError();
  }
}
