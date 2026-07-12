import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase-server";

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
      .select("id, provider, provider_call_id")
      .eq("id", call_id)
      .single();

    if (error || !call) {
      throw new ApiNotFoundError("call", call_id);
    }

    if (!call.provider_call_id) {
      return new Response(
        JSON.stringify({ code: 404, message: "No provider call ID found for this call" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const providerResponse = await fetchProviderAudio(call.provider, call.provider_call_id);

    if (!providerResponse.ok) {
      const errorText = await providerResponse.text();
      return new Response(
        JSON.stringify({ code: providerResponse.status, message: `Provider error: ${errorText}` }),
        { status: providerResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Strip provider auth headers and other sensitive headers
    const safeHeaders = new Headers();
    const allowedHeaders = [
      "content-type",
      "content-length",
      "content-disposition",
      "accept-ranges",
      "cache-control",
    ];

    providerResponse.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        safeHeaders.set(key, value);
      }
    });

    return new Response(providerResponse.body, {
      status: providerResponse.status,
      headers: safeHeaders,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

async function fetchProviderAudio(provider: string, providerCallId: string): Promise<Response> {
  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

    // Fetch recordings list
    const recordingsUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}/Recordings.json`;
    const recordingsResponse = await fetch(recordingsUrl, {
      headers: { Authorization: authHeader },
    });

    if (!recordingsResponse.ok) {
      return recordingsResponse;
    }

    const recordingsData = await recordingsResponse.json();
    const recordings = recordingsData.recordings || [];

    if (recordings.length === 0) {
      return new Response(
        JSON.stringify({ code: 404, message: "No recordings found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch the first recording's audio
    const recordingSid = recordings[0].sid;
    const audioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;

    return fetch(audioUrl, {
      headers: { Authorization: authHeader },
    });
  }

  if (provider === "telnyx") {
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      throw new Error("Telnyx API key not configured");
    }

    const authHeader = `Bearer ${apiKey}`;

    // Fetch recordings list
    const recordingsUrl = `https://api.telnyx.com/v2/calls/${providerCallId}/recordings`;
    const recordingsResponse = await fetch(recordingsUrl, {
      headers: { Authorization: authHeader },
    });

    if (!recordingsResponse.ok) {
      return recordingsResponse;
    }

    const recordingsData = await recordingsResponse.json();
    const recordings = recordingsData.data || [];

    if (recordings.length === 0) {
      return new Response(
        JSON.stringify({ code: 404, message: "No recordings found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch the first recording's audio
    const audioUrl = recordings[0].recording_url || recordings[0].url || recordings[0].download_url;
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ code: 404, message: "No recording URL found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return fetch(audioUrl, {
      headers: { Authorization: authHeader },
    });
  }

  return new Response(
    JSON.stringify({ code: 400, message: "Unknown provider" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
