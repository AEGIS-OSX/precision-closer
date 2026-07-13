import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    const { userId, role } = await requireAuth(request);
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const supabase = createServerClient();
    let query = supabase
      .from("leads")
      .select("*")
      .eq("id", params.lead_id);

    if (role !== "admin") {
      query = query.eq("owner_id", userId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      throw new ApiNotFoundError("Lead", params.lead_id);
    }

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    const { userId, role } = await requireAuth(request);
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const supabase = createServerClient();

    // Fetch the lead first to verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select("id, owner_id")
      .eq("id", params.lead_id)
      .single();

    if (fetchError || !existing) {
      throw new ApiNotFoundError("Lead", params.lead_id);
    }

    if (role !== "admin" && existing.owner_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

export async function PUT(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    const { userId, role } = await requireAuth(request);
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const supabase = createServerClient();

    // Fetch the lead first to verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select("id, owner_id")
      .eq("id", params.lead_id)
      .single();

    if (fetchError || !existing) {
      throw new ApiNotFoundError("Lead", params.lead_id);
    }

    if (role !== "admin" && existing.owner_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    const { userId, role } = await requireAuth(request);
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const supabase = createServerClient();

    // Fetch the lead first to verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select("id, owner_id")
      .eq("id", params.lead_id)
      .single();

    if (fetchError || !existing) {
      throw new ApiNotFoundError("Lead", params.lead_id);
    }

    if (role !== "admin" && existing.owner_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
