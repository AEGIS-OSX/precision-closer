import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";

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

  // 3. Dialer stop logic (stub)
  const userId = authResult.user.id;
  console.log(`[dialer:stop] user=${userId}`);

  return NextResponse.json(
    { success: true, message: "Dialer stopped" },
    { status: 200 }
  );
}
