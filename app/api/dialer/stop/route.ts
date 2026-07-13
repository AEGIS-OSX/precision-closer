import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { errorResponse } from "@/lib/errors"

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Auth + role guard — requireRole throws ApiAuthError(401) if not authed,
    //    ApiAuthError(403) if role is not "admin". errorResponse handles both.
    const { userId } = await requireRole(request, ["admin"])

    // 2. Dialer stop logic placeholder
    // TODO: integrate with dialer service
    return NextResponse.json(
      { status: "stopped", initiated_by: userId },
      { status: 200 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
