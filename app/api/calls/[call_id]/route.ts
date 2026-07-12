import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase-server";
import type { Call } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { call_id: string } }
): Promise<Response> {
  try {
    await requireAuth(request);
    const { call_id } = params;

    const serverClient = createServerClient();

    const { data: call, error } = await serverClient
      .from("calls")
      .select("*")
      .eq("id", call_id)
      .single();

    if (error || !call) {
      throw new ApiNotFoundError("call", call_id);
    }

    return new Response(JSON.stringify(call as Call), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
