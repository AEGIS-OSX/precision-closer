import { randomBytes } from "crypto";
import { requireRole } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase-server";
import type { TakeoverResponse } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: { call_id: string } }
): Promise<Response> {
  try {
    const auth = await requireRole(request, ["operator", "admin"]);
    const { call_id } = params;

    const serverClient = createServerClient();

    const { data: call, error: callError } = await serverClient
      .from("calls")
      .select("id, status, provider, provider_call_id")
      .eq("id", call_id)
      .single();

    if (callError || !call) {
      throw new ApiNotFoundError("call", call_id);
    }

    const bridgeToken = randomBytes(32).toString("hex");
    const bridgeTokenExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { error: insertError } = await serverClient.from("takeover_events").insert({
      call_id: call_id,
      operator_id: auth.userId,
      bridge_token: bridgeToken,
      bridge_token_expires_at: bridgeTokenExpiresAt,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to create takeover event: ${insertError.message}`);
    }

    const { error: updateError } = await serverClient
      .from("calls")
      .update({ status: "bridging", updated_at: new Date().toISOString() })
      .eq("id", call_id);

    if (updateError) {
      throw new Error(`Failed to update call status: ${updateError.message}`);
    }

    const bridgeUri = `wss://api.precisioncloser.cc/v1/bridge/${call_id}`;

    const response: TakeoverResponse = {
      status: "bridging",
      bridge_uri: bridgeUri,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
