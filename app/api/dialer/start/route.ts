import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { errorResponse, ApiValidationError } from "@/lib/errors"

// Per-user rate limit: max 1 start call per 60 seconds
const startRateLimit = new Map<string, number>()

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Auth + role guard — requireRole throws ApiAuthError(401) if not authed,
    //    ApiAuthError(403) if role is not "admin". errorResponse handles both.
    const { userId } = await requireRole(request, ["admin"])

    // 2. Per-user rate limit: 1 call per 60 seconds
    const now = Date.now()
    const lastCall = startRateLimit.get(userId)
    if (lastCall !== undefined && now - lastCall < 60_000) {
      return NextResponse.json(
        { error: "Rate limit exceeded: dialer start may only be called once per 60 seconds" },
        { status: 429 }
      )
    }
    startRateLimit.set(userId, now)

    // 3. Input validation
    const body = await request.json()
    const batchSize = body?.batch_size

    if (
      batchSize === undefined ||
      batchSize === null ||
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > 1000
    ) {
      throw new ApiValidationError(
        "batch_size",
        "batch_size must be a positive integer between 1 and 1000"
      )
    }

    // 4. Dialer start logic placeholder
    // TODO: integrate with dialer service
    return NextResponse.json(
      { status: "started", batch_size: batchSize, initiated_by: userId },
      { status: 200 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
