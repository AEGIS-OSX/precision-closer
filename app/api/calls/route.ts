import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError, ApiValidationError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase-server";
import { initiateCall } from "@/lib/telephony";
import type { InitiateCallRequest, InitiateCallResponse } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  try {
    const auth = await requireAuth(request);
    const body: InitiateCallRequest = await request.json();

    if (!body.lead_id || !body.script_id) {
      throw new ApiValidationError("body", "lead_id and script_id are required");
    }

    const serverClient = createServerClient();

    const { data: lead, error: leadError } = await serverClient
      .from("leads")
      .select("id, status, phone_number")
      .eq("id", body.lead_id)
      .single();

    if (leadError || !lead) {
      throw new ApiNotFoundError("lead", body.lead_id);
    }

    if (lead.status === "qualified") {
      return new Response(
        JSON.stringify({
          code: 422,
          message: "Lead is already qualified",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const provider = (process.env.TELEPHONY_PROVIDER as "twilio" | "telnyx") || "twilio";
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/${provider}`;

    const { providerCallId, uri } = await initiateCall(provider, lead.phone_number, callbackUrl);

    const callId = `call_${randomUUID().replace(/-/g, "").slice(0, 8)}`;

    const { error: insertError } = await serverClient.from("calls").insert({
      id: callId,
      lead_id: body.lead_id,
      script_id: body.script_id,
      voice_id: body.voice_id || null,
      status: "dialing",
      provider: provider,
      provider_call_id: providerCallId,
      uri: uri,
      created_by: auth.userId,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to create call record: ${insertError.message}`);
    }

    const { error: updateError } = await serverClient
      .from("leads")
      .update({ status: "dialing", updated_at: new Date().toISOString() })
      .eq("id", body.lead_id);

    if (updateError) {
      throw new Error(`Failed to update lead status: ${updateError.message}`);
    }

    const response: InitiateCallResponse = {
      call_id: callId,
      status: "dialing",
      uri: uri,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
