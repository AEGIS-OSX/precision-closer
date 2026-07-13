import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { CrmPushRequest } from "@/lib/types";

type CrmPushBody = CrmPushRequest & { crm_endpoint: string };

const ALLOWED_CRM_HOSTS = new Set([
  "api.salesforce.com",
  "api.hubapi.com",
  "api.pipedrive.com",
  "app.close.com",
  "api.zoho.com",
]);

function isPrivateIP(ip: string): boolean {
  // IPv6 loopback
  if (ip === "::1") return true;

  // IPv6 ULA fc00::/7
  if (/^f[cd]/i.test(ip)) return true;

  // IPv6 link-local fe80::/10
  if (/^fe[89ab]/i.test(ip)) return true;

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false; // non-IPv4, treat as safe for allowlist path

  const [a, b] = parts;

  // 127.0.0.0/8
  if (a === 127) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (link-local / IMDS)
  if (a === 169 && b === 254) return true;

  return false;
}

async function validateCrmEndpoint(
  crm_endpoint: string
): Promise<{ valid: boolean; reason?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(crm_endpoint);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  // Must be HTTPS
  if (parsed.protocol !== "https:") {
    return { valid: false, reason: "Only HTTPS endpoints are allowed" };
  }

  const hostname = parsed.hostname;

  // Allowlist check (primary defense)
  if (!ALLOWED_CRM_HOSTS.has(hostname)) {
    return { valid: false, reason: "CRM endpoint hostname not in allowlist" };
  }

  // DNS resolution check (defense in depth against DNS rebinding)
  try {
    const { address } = await dns.promises.lookup(hostname);
    if (isPrivateIP(address)) {
      return { valid: false, reason: "CRM endpoint resolves to a private IP address" };
    }
  } catch {
    return { valid: false, reason: "Unable to resolve CRM endpoint hostname" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const authHeader = request.headers.get("authorization") ?? "";
    const userId = authHeader.replace(/^Bearer\s+/i, "") || "anonymous";
    const rl = await checkRateLimit(userId);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = (await request.json()) as CrmPushBody;
    const { lead_id, crm_endpoint } = body;

    const validation = await validateCrmEndpoint(crm_endpoint);
    if (!validation.valid) {
      return NextResponse.json({ error: "Invalid CRM endpoint" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, qualification_data(*)")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new ApiNotFoundError("Lead", lead_id);
    }

    try {
      const response = await fetch(crm_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        return NextResponse.json({ pushed: false });
      }

      return NextResponse.json({ pushed: true });
    } catch (fetchError) {
      return NextResponse.json({ pushed: false, error: "Network error" });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
