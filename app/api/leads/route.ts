import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { errorResponse, ApiValidationError } from "@/lib/errors"
import { validateE164, validateRequiredString } from "@/lib/validate"
import type { Lead, CreateLeadRequest, CreateLeadResponse, PaginatedResponse } from "@/lib/types"

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "20", 10) || 20))

    const client = createServerClient()
    let query = client.from("leads").select("*", { count: "exact" })

    if (status) {
      query = query.eq("status", status)
    }

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await query.range(from, to).order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    const response: PaginatedResponse<Lead> = {
      data: (data || []) as Lead[],
      total: count || 0,
      page,
      page_size: perPage,
      has_more: (count || 0) > page * perPage,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAuth(request)

    const body = (await request.json()) as CreateLeadRequest

    const firstName = validateRequiredString(body.first_name, "first_name")
    const lastName = validateRequiredString(body.last_name, "last_name")
    const phoneNumber = validateRequiredString(body.phone_number, "phone_number")

    if (!validateE164(phoneNumber)) {
      throw new ApiValidationError("phone_number", "phone_number must be a valid E.164 number")
    }

    const client = createServerClient()

    const { data: dncData, error: dncError } = await client
      .from("dnc_list")
      .select("id")
      .eq("phone_number", phoneNumber)
      .limit(1)

    if (dncError) {
      throw dncError
    }

    if (dncData && dncData.length > 0) {
      throw new ApiValidationError("phone_number", "Phone number is on the DNC list")
    }

    const { data, error } = await client
      .from("leads")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        company_name: body.company_name || null,
        metadata: body.metadata || null,
        status: "not_called",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error("Insert returned no data")
    }

    const lead = data as Lead
    const response: CreateLeadResponse = {
      id: lead.id,
      status: lead.status,
      created_at: lead.created_at,
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
