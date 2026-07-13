import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", params.lead_id)
      .single();

    if (error || !data) {
      throw new ApiNotFoundError("Lead", params.lead_id);
    }

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("leads")
      .update(body)
      .eq("id", params.lead_id)
      .select()
      .single();

    if (error || !data) {
      throw new ApiNotFoundError("Lead", params.lead_id);
    }

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const supabase = createServerClient();
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", params.lead_id);

    if (error) throw error;

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
