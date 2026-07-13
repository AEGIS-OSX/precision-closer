import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { errorResponse } from "@/lib/errors"
import { checkRateLimit } from "@/lib/rate-limit"
import type { Lead } from "@/lib/types"

function escapeCSV(value: string | null | undefined): string {
  const str = value ?? ""
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function serializeCSV(leads: Lead[]): string {
  const headers = ["id", "first_name", "last_name", "phone_number", "company_name", "status", "created_at"]
  const rows = leads.map((lead) => [
    lead.id,
    lead.first_name,
    lead.last_name,
    lead.phone_number,
    lead.company_name,
    lead.status,
    lead.created_at,
  ])

  return [headers.join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n") + "\n"
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { userId } = await requireAuth(request)
    const authHeader = request.headers.get("authorization") ?? ""
    const rlKey = authHeader.replace(/^Bearer\s+/i, "") || "anonymous"
    const rl = await checkRateLimit(rlKey)
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

    const client = createServerClient()
    const { data, error } = await client
      .from("leads")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    const csv = serializeCSV((data || []) as Lead[])

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="leads.csv"',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
