import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { errorResponse, ApiValidationError } from "@/lib/errors"
import { validateE164 } from "@/lib/validate"

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: Array<Record<string, string>> = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    rows.push(row)
  }

  return rows
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAuth(request)

    const formData = await request.formData()
    const fileEntry = formData.get("file")

    if (!fileEntry || typeof fileEntry === "string") {
      throw new ApiValidationError("file", "No CSV file provided")
    }

    const file = fileEntry as File
    const text = (await file.text()).replace(/^\uFEFF/, "")
    const rows = parseCSV(text)

    const client = createServerClient()
    const validLeads: Array<{
      first_name: string
      last_name: string
      phone_number: string
      company_name: string | null
      metadata: null
      status: string
    }> = []
    const skipped: Array<{ row: number; phone_number: string }> = []
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const firstName = row.first_name?.trim()
      const lastName = row.last_name?.trim()
      const phoneNumber = row.phone_number?.trim()
      const companyName = row.company_name?.trim() || null

      if (!firstName || !lastName || !phoneNumber) {
        errors.push(`Row ${rowNum}: missing required field`)
        continue
      }

      if (!validateE164(phoneNumber)) {
        errors.push(`Row ${rowNum}: invalid phone number`)
        continue
      }

      const { data: dncData } = await client
        .from("dnc_list")
        .select("id")
        .eq("phone_number", phoneNumber)
        .limit(1)

      if (dncData && dncData.length > 0) {
        skipped.push({ row: rowNum, phone_number: phoneNumber })
        continue
      }

      validLeads.push({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        company_name: companyName,
        metadata: null,
        status: "not_called",
      })
    }

    let inserted = 0
    if (validLeads.length > 0) {
      const { error } = await client.from("leads").insert(validLeads)
      if (error) {
        throw error
      }
      inserted = validLeads.length
    }

    return new Response(
      JSON.stringify({
        inserted,
        skipped: skipped.length,
        errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
