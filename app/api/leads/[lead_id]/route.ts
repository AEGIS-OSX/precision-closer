import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { errorResponse, ApiNotFoundError } from "@/lib/errors"
import type { Lead } from "@/lib/types"

export async function GET(request: Request, { params }: { params: { lead_id: string } }): Promise<Response> {
  try {
    await requireAuth(request)
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? ""
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous"
    const rl = await checkRateLimit(userId)
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

    const client = createServerClient()
    const { data, error } = await client.from("leads").select("*").eq("id", params.lead_id).single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new ApiNotFoundError("Lead not found")
    }

    return new Response(JSON.stringify(data as Lead), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, { params }: { params: { lead_id: string } }): Promise<Response> {
  try {
    await requireAuth(request)
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? ""
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous"
    const rl = await checkRateLimit(userId)
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

    const body = await request.json()
    const client = createServerClient()

    const { data, error } = await client.from("leads").update(body).eq("id", params.lead_id).select().single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new ApiNotFoundError("Lead not found")
    }

    return new Response(JSON.stringify(data as Lead), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: { params: { lead_id: string } }): Promise<Response> {
  try {
    await requireAuth(request)
    const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? ""
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous"
    const rl = await checkRateLimit(userId)
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

    const client = createServerClient()
    const { error } = await client.from("leads").delete().eq("id", params.lead_id)

    if (error) {
      throw error
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
