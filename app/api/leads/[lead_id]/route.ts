import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { LeadStatus } from "@/lib/types";

// Runtime allowlist derived from the LeadStatus union type in lib/types.ts.
// If LeadStatus values change, update this array to match.
const VALID_LEAD_STATUSES: LeadStatus[] = [
  "not_called",
  "dialing",
  "connected",
  "qualified",
  "not_interested",
  "no_answer",
  "voicemail",
  "failed",
];

export async function GET(request: NextRequest, { params }: { params: { lead_id: string } }) {
  try {
    const { userId } = await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const rlKey = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(rlKey);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", params.lead_id)
      .eq("owner_id", userId)
      .single();

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
    const { userId } = await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const rlKey = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(rlKey);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_LEAD_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = body.status as LeadStatus;
    }

    // Copy other allowed fields from body (excluding status, already handled)
    const { status: _status, ...rest } = body;
    Object.assign(updateData, rest);

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", params.lead_id)
      .eq("owner_id", userId)
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
    const { userId } = await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const rlKey = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(rlKey);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("leads")
      .update(body)
      .eq("id", params.lead_id)
      .eq("owner_id", userId)
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
    const { userId } = await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const rlKey = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(rlKey);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const supabase = createServerClient();
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", params.lead_id)
      .eq("owner_id", userId);

    if (error) throw error;

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}