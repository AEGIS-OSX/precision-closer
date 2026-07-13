import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fallback in-process store for local dev (no Redis env vars)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimitLocal(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowMs = 60_000
  const limit = 100
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1 }
  }
  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return { allowed: entry.count <= limit, remaining }
}

let redisRatelimit: Ratelimit | null = null

function getRedisRatelimit(): Ratelimit | null {
  if (redisRatelimit) return redisRatelimit

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    console.warn(
      '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. ' +
        'Falling back to in-process rate limiter (not safe for multi-instance deployments).'
    )
    return null
  }

  redisRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl',
  })

  return redisRatelimit
}

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const rl = getRedisRatelimit()

  if (!rl) {
    return checkRateLimitLocal(userId)
  }

  const result = await rl.limit(userId)
  return {
    allowed: result.success,
    remaining: result.remaining,
  }
}
