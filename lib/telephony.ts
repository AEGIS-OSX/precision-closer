import { randomUUID } from "crypto";

export interface TelephonyProvider {
  initiateCall(to: string, callbackUrl: string): Promise<{ providerCallId: string; uri: string }>;
  cancelCall(providerCallId: string): Promise<void>;
}

class TwilioProvider implements TelephonyProvider {
  async initiateCall(to: string, callbackUrl: string): Promise<{ providerCallId: string; uri: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const body = new URLSearchParams({
      To: to,
      From: fromNumber || "",
      Url: callbackUrl,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      providerCallId: data.sid,
      uri: data.uri || `/v1/calls/${data.sid}`,
    };
  }

  async cancelCall(providerCallId: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${providerCallId}.json`;
    const body = new URLSearchParams({ Status: "canceled" });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio API error: ${response.status} ${errorText}`);
    }
  }
}

class TelnyxProvider implements TelephonyProvider {
  async initiateCall(to: string, callbackUrl: string): Promise<{ providerCallId: string; uri: string }> {
    const apiKey = process.env.TELNYX_API_KEY;
    const fromNumber = process.env.TELNYX_FROM_NUMBER;
    const connectionId = process.env.TELNYX_CONNECTION_ID;

    if (!apiKey) {
      throw new Error("Telnyx API key not configured");
    }

    const url = "https://api.telnyx.com/v2/calls";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: to,
        from: fromNumber || "",
        webhook_url: callbackUrl,
        connection_id: connectionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telnyx API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      providerCallId: data.data?.call_control_id || data.data?.id || randomUUID(),
      uri: data.data?.self || `/v1/calls/${data.data?.call_control_id || data.data?.id}`,
    };
  }

  async cancelCall(providerCallId: string): Promise<void> {
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey) {
      throw new Error("Telnyx API key not configured");
    }

    const url = `https://api.telnyx.com/v2/calls/${providerCallId}/actions/hangup`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telnyx API error: ${response.status} ${errorText}`);
    }
  }
}

const providers: Record<string, TelephonyProvider> = {
  twilio: new TwilioProvider(),
  telnyx: new TelnyxProvider(),
};

export function getProvider(name: "twilio" | "telnyx"): TelephonyProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown telephony provider: ${name}`);
  }
  return provider;
}

export async function initiateCall(
  provider: "twilio" | "telnyx",
  to: string,
  callbackUrl: string
): Promise<{ providerCallId: string; uri: string }> {
  return getProvider(provider).initiateCall(to, callbackUrl);
}

export async function cancelCall(provider: "twilio" | "telnyx", providerCallId: string): Promise<void> {
  return getProvider(provider).cancelCall(providerCallId);
}
