import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
)
const redis = hasRedisConfig ? Redis.fromEnv() : null
const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "heretics-tracker",
      analytics: true,
    })
  : null
const fallback = new Map<string, { count: number; reset: number }>()

const getClientKey = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  return ip
}

export async function enforceRateLimit(request: Request, scope: string) {
  const key = `${scope}:${getClientKey(request)}`
  const now = Date.now()
  const result = limiter
    ? await limiter.limit(key)
    : (() => {
        const current = fallback.get(key)
        const entry = !current || current.reset <= now ? { count: 0, reset: now + 60_000 } : current
        entry.count += 1
        fallback.set(key, entry)
        return { success: entry.count <= 30, limit: 30, remaining: Math.max(0, 30 - entry.count), reset: entry.reset }
      })()

  if (result.success) return null

  return NextResponse.json(
    { error: "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((result.reset - now) / 1000))),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "Cache-Control": "no-store",
      },
    },
  )
}
