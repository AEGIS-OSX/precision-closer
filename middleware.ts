import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Use Redis.fromEnv() so the Edge-safe REST build is selected. Constructing
// with `new Redis({...})` pulls the nodejs conditional export, which reads
// process.version and is unsupported in the Edge Runtime (middleware is
// Edge-only and cannot opt into the Node runtime).
const redis = Redis.fromEnv();

const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
});

const PRE_AUTH_ROUTES = ["/api/auth/", "/api/login", "/api/signup", "/api/password-reset"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPreAuth = PRE_AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isPreAuth) {
    return NextResponse.next();
  }

  const ip =
    request.ip ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const { success, reset } = await ipRatelimit.limit(`ip:${ip}`);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/login", "/api/signup", "/api/password-reset"],
};
