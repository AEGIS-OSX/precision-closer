import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  // 1. Auth guard — must be authenticated
  const authResult = await requireAuth(request);
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role guard — must be admin
  const roleResult = requireRole(authResult.user, "admin");
  if (!roleResult.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Rate limiting — no more than 1 start call per 60s per user
  const userId = authResult.user.id;
  const now = Date.now();
  const lastCall = rateLimitMap.get(userId);
  if (lastCall && now - lastCall < RATE_LIMIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }
  rateLimitMap.set(userId, now);

  // 4. Input validation
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const batchSizeRaw = body.batch_size;
  if (
    typeof batchSizeRaw !== "number" ||
    !Number.isInteger(batchSizeRaw) ||
    batchSizeRaw < 1 ||
    batchSizeRaw > 1000
  ) {
    return NextResponse.json(
      { error: "batch_size must be a positive integer between 1 and 1000" },
      { status: 400 }
    );
  }

  // 5. Dialer logic (stub)
  console.log(`[dialer:start] user=${userId} batch_size=${batchSizeRaw}`);

  return NextResponse.json(
    { success: true, message: "Dialer started", batch_size: batchSizeRaw },
    { status: 200 }
  );
}
