import { ApiRateLimitError } from "./errors";

const WINDOW_MS = 60000;
const MAX_REQUESTS = 100;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

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
// TODO(production): replace with Redis-backed rate limiter for multi-instance
