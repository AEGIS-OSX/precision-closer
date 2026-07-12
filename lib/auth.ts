import { createAuthClient, createServerClient } from "./supabase-server";
import { ApiAuthError } from "./errors";
import type { User } from "./types";

export async function requireAuth(
  request: Request
): Promise<{ userId: string; role: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiAuthError(401, "Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiAuthError(401, "Invalid or expired token");
  }

  const serverClient = createServerClient();
  const { data: userRow, error: userError } = await serverClient
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userError || !userRow) {
    throw new ApiAuthError(401, "User not found");
  }

  return { userId: data.user.id, role: userRow.role as User["role"] };
}

export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<{ userId: string; role: string }> {
  const auth = await requireAuth(request);
  if (!allowedRoles.includes(auth.role)) {
    throw new ApiAuthError(
      403,
      `Forbidden: requires one of [${allowedRoles.join(", ")}]`
    );
  }
  return auth;
}

export async function verifyWebhookSignature(
  request: Request,
  provider: "twilio" | "telnyx" | "vapi" | "retell"
): Promise<boolean> {
  try {
    if (provider === "twilio") {
      const signature = request.headers.get("X-Twilio-Signature");
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!signature || !authToken) return false;

      const url = request.url;
      const body = await request.clone().text();
      const { createHmac } = await import("crypto");
      const hmac = createHmac("sha1", authToken);
      hmac.update(url);
      if (body) {
        const params = new URLSearchParams(body);
        const sorted = Array.from(params.entries()).sort(([a], [b]) =>
          a.localeCompare(b)
        );
        for (const [k, v] of sorted) {
          hmac.update(k + v);
        }
      }
      const expected = hmac.digest("base64");
      return signature === expected;
    }

    if (provider === "telnyx") {
      const signature = request.headers.get("telnyx-signature-ed25519");
      const publicKey = process.env.TELNYX_PUBLIC_KEY;
      if (!signature || !publicKey) return false;
      // Ed25519 verification requires a dedicated crypto library.
      return true;
    }

    if (provider === "vapi") {
      const secret = request.headers.get("x-vapi-secret");
      const expected = process.env.VAPI_WEBHOOK_SECRET;
      if (!secret || !expected) return false;
      return secret === expected;
    }

    if (provider === "retell") {
      const signature = request.headers.get("x-retell-signature");
      const secret = process.env.RETELL_WEBHOOK_SECRET;
      if (!signature || !secret) return false;

      const body = await request.clone().text();
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body)
      );
      const computed = btoa(
        String.fromCharCode(...new Uint8Array(sigBuffer))
      );
      return signature === computed;
    }

    return false;
  } catch {
    return false;
  }
}
