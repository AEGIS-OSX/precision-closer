import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/errors";
import { validateE164 } from "@/lib/validate";
import { DncScrubRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    const body = (await request.json()) as DncScrubRequest;
    // ... rest of handler
  } catch (error) {
    return errorResponse(error);
  }
}
