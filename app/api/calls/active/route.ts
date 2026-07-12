import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase-server";
import type { Call } from "@/lib/types";

const ACTIVE_STATUSES = ["dialing", "ringing", "connected", "bridging", "bridged"];

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAuth(request);

    const serverClient = createServerClient();

    const { data: calls, error } = await serverClient
      .from("calls")
      .select("*")
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active calls: ${error.message}`);
    }

    return new Response(JSON.stringify((calls || []) as Call[]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
