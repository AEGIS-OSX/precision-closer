import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { CrmPushRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    // ... rest of handler
  } catch (error) {
    return errorResponse(error);
  }
}
