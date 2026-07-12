import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { errorResponse, ApiNotFoundError } from "@/lib/errors"
import type { Lead, LeadStatus } from "@/lib/types"

export async function GET(request: Request, { params }: { params: { lead_id: string } }): Promise<Response> {
  try {
    await requireAuth(request)

    const client = createServerClient()
    const { data, error } = await client
      .from("leads")
      .select("*")
      .eq("id", params.lead_id)
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

export async function PATCH(request: Request, { params }: { params: { lead_id: string } }): Promise<Response> {
  try {
    await requireAuth(request)

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

    const client = createServerClient()
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
