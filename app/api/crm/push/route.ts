import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { lead_id, crm_endpoint } = body;

    if (typeof crm_endpoint !== "string" || !crm_endpoint.startsWith("https://")) {
      return NextResponse.json(
        { code: 400, message: "crm_endpoint must use HTTPS" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, qualification_data(*)")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new ApiNotFoundError("Lead", lead_id);
    }

    try {
      const response = await fetch(crm_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        return NextResponse.json({ pushed: false, crm_status: response.status });
      }

      return NextResponse.json({ pushed: true });
    } catch (fetchError) {
      return NextResponse.json({ pushed: false, error: "Network error" });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
