import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, ApiNotFoundError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { CrmPushRequest } from "@/lib/types";
import dns from "dns";

type CrmPushBody = CrmPushRequest & { crm_endpoint: string };

/**
 * Allowlist of permitted CRM hostnames.
 * Only these hosts may receive lead data via server-side fetch.
 * Add new CRM vendors here after security review.
 */
const CRM_HOSTNAME_ALLOWLIST = new Set([
  "api.salesforce.com",
  "api.hubapi.com",
  "api.pipedrive.com",
  "api.zoho.com",
  "api.close.com",
  "api.copper.com",
  "api.freshsales.io",
]);

/**
 * Returns true if the given IPv4 address falls in a private/reserved range.
 * Blocks: loopback (127/8), RFC-1918 (10/8, 172.16/12, 192.168/16),
 * link-local/IMDS (169.254/16).
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed — treat as unsafe
  }
  const [a, b] = parts;
  if (a === 127) return true;                          // 127.0.0.0/8 loopback
  if (a === 10) return true;                           // 10.0.0.0/8 RFC-1918
  if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12 RFC-1918
  if (a === 192 && b === 168) return true;             // 192.168.0.0/16 RFC-1918
  if (a === 169 && b === 254) return true;             // 169.254.0.0/16 link-local/IMDS
  return false;
}

/**
 * Returns true if the given IPv6 address is private/reserved.
 * Blocks: ::1 (loopback), fc00::/7 (ULA), fe80::/10 (link-local).
 */
function isPrivateIPv6(ip: string): boolean {
  // Strip brackets if present (e.g. [::1] -> ::1)
  const addr = ip.replace(/^\[|\]$/g, "").toLowerCase();
  if (addr === "::1") return true;                     // loopback
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // fc00::/7 ULA
  if (addr.startsWith("fe8") || addr.startsWith("fe9") ||
      addr.startsWith("fea") || addr.startsWith("feb")) return true; // fe80::/10 link-local
  return false;
}

/**
 * Validates a CRM endpoint URL against the allowlist and private IP ranges.
 * Returns an error string if the endpoint is rejected, or null if it is safe.
 */
async function validateCrmEndpoint(rawUrl: string): Promise<string | null> {
  // 1. Must be a valid URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "Invalid URL";
  }

  // 2. Must use HTTPS
  if (parsed.protocol !== "https:") {
    return "crm_endpoint must use HTTPS";
  }

  const hostname = parsed.hostname;

  // 3. Allowlist check (primary defense — eliminates DNS-rebinding)
  if (!CRM_HOSTNAME_ALLOWLIST.has(hostname)) {
    return "crm_endpoint hostname is not an approved CRM provider";
  }

  // 4. DNS resolution + private IP check (defense-in-depth)
  try {
    const { address, family } = await dns.promises.lookup(hostname);
    if (family === 4 && isPrivateIPv4(address)) {
      return "crm_endpoint resolves to a disallowed IP range";
    }
    if (family === 6 && isPrivateIPv6(address)) {
      return "crm_endpoint resolves to a disallowed IP range";
    }
  } catch {
    return "crm_endpoint hostname could not be resolved";
  }

  return null; // safe
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

    if (typeof crm_endpoint !== "string" || !crm_endpoint) {
      return NextResponse.json(
        { code: 400, message: "crm_endpoint is required" },
        { status: 400 }
      );
    }

    // Validate endpoint — error message never echoes the caller-supplied value
    const validationError = await validateCrmEndpoint(crm_endpoint);
    if (validationError !== null) {
      return NextResponse.json(
        { code: 400, message: validationError },
        { status: 400 }
      );
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
        // Do not reflect the upstream CRM status verbatim
        return NextResponse.json({ pushed: false, error: "CRM push failed" }, { status: 502 });
      }

      return NextResponse.json({ pushed: true });
    } catch (fetchError) {
      return NextResponse.json({ pushed: false, error: "Network error" }, { status: 502 });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
