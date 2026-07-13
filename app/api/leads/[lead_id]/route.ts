import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { errorResponse, ApiNotFoundError } from "@/lib/errors"
import type { Lead, LeadStatus } from "@/lib/types"

export async function GET(request: Request, { params }: { params: { lead_id: string } }): Promise<Response> {
  try {
    const session = await requireAuth(request)
    const userId = session.userId
    const role = session.role ?? null

    const client = createServerClient()
    let query = client
      .from("leads")
      .select("*")
      .eq("id", params.lead_id)

    if (role !== "admin") {
      query = query.eq("owner_id", userId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      throw new ApiNotFoundError("Lead", params.lead_id)
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
    const session = await requireAuth(request)
    const userId = session.userId
    const role = session.role ?? null

    const client = createServerClient()

    // Fetch the lead first to verify ownership before mutating
    const { data: existing, error: fetchError } = await client
      .from("leads")
      .select("id, owner_id")
      .eq("id", params.lead_id)
      .single()

    if (fetchError || !existing) {
      throw new ApiNotFoundError("Lead", params.lead_id)
    }

    if (role !== "admin" && existing.owner_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = (await request.json()) as Record<string, unknown>

    const updateData: Partial<Pick<Lead, "status" | "metadata" | "company_name">> = {}

    if (body.status !== undefined) {
      updateData.status = body.status as LeadStatus
    }
    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata as Record<string, string>
    }
    if (body.company_name !== undefined) {
      updateData.company_name = body.company_name as string | null
    }

    const { data, error } = await client
      .from("leads")
      .update(updateData)
      .eq("id", params.lead_id)
      .select()
      .single()

    if (error || !data) {
      throw new ApiNotFoundError("Lead", params.lead_id)
    }

    return new Response(JSON.stringify(data as Lead), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
