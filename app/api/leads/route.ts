import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiValidationError } from "@/lib/errors";
import { validateE164, validateRequiredString } from "@/lib/validate";
import type { Lead, CreateLeadRequest, CreateLeadResponse, PaginatedResponse } from "@/lib/types";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("per_page") ?? "20", 10))
    );

    const supabase = createServerClient();

    let query = supabase.from("leads").select("*", { count: "exact" });
    if (status) {
      query = query.eq("status", status);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await query.range(from, to).order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const total = count ?? 0;
    const response: PaginatedResponse<Lead> = {
      data: (data ?? []) as Lead[],
      total,
      page,
      page_size: perPage,
      has_more: total > page * perPage,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await requireAuth(request);

    const body: CreateLeadRequest = await request.json();

    const firstName = validateRequiredString(body.first_name, "first_name");
    const lastName = validateRequiredString(body.last_name, "last_name");

    if (!validateE164(body.phone_number)) {
      throw new ApiValidationError("phone_number", "Invalid phone number format");
    }

    const supabase = createServerClient();

    const { data: dncRow } = await supabase
      .from("dnc_list")
      .select("id")
      .eq("phone_number", body.phone_number)
      .limit(1)
      .single();

    if (dncRow) {
      return new Response(
        JSON.stringify({
          code: 422,
          message: "Phone number is on the DNC list",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone_number: body.phone_number,
        company_name: body.company_name ?? null,
        status: "not_called",
        metadata: body.metadata ?? null,
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      throw error;
    }

    const response: CreateLeadResponse = {
      id: data.id,
      status: data.status,
      created_at: data.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
