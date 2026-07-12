import { createAuthClient, createServerClient } from "@/lib/supabase-server";
import { ApiAuthError } from "@/lib/errors";
import { createHmac, createPublicKey, verify, timingSafeEqual } from "crypto";

export async function requireAuth(request: Request): Promise<{ userId: string; role: string }> {
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
  const { data: userData, error: userError } = await serverClient
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userError || !userData) {
    throw new ApiAuthError(401, "User not found");
  }

  return { userId: data.user.id, role: userData.role };
}

export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<{ userId: string; role: string }> {
  const auth = await requireAuth(request);
  if (!allowedRoles.includes(auth.role)) {
    throw new ApiAuthError(403, `Role '${auth.role}' is not authorized for this resource`);
  }
  return auth;
}

export async function verifyWebhookSignature(
  request: Request,
  provider: "twilio" | "telnyx" | "vapi" | "retell"
): Promise<boolean> {
  try {
    switch (provider) {
      case "twilio": {
        const twilioSignature = request.headers.get("X-Twilio-Signature");
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!twilioSignature || !authToken) return false;

        const url = request.url;
        const clonedRequest = request.clone();
        const bodyText = await clonedRequest.text();

        let payload = url;
        const contentType = request.headers.get("Content-Type") || "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams(bodyText);
          const sortedKeys = Array.from(params.keys()).sort();
          for (const key of sortedKeys) {
            const value = params.get(key) || "";
            payload += key + value;
          }
        } else if (bodyText) {
          payload += bodyText;
        }

        const expected = createHmac("sha1", authToken).update(payload).digest("base64");
        return expected === twilioSignature;
      }

      case "telnyx": {
        const signature = request.headers.get("telnyx-signature-ed25519");
        const publicKeyBase64 = process.env.TELNYX_PUBLIC_KEY;
        if (!signature || !publicKeyBase64) return false;

        const clonedRequest = request.clone();
        const body = await clonedRequest.text();

        const publicKeyBuffer = Buffer.from(publicKeyBase64, "base64");
        const publicKey = createPublicKey({
          key: publicKeyBuffer,
          format: "der",
          type: "spki",
        });

        return verify("ed25519", Buffer.from(body), publicKey, Buffer.from(signature, "base64"));
      }

      case "vapi": {
        const secret = request.headers.get("x-vapi-secret");
        const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
        if (!secret || !expectedSecret) return false;
        const a = Buffer.from(secret);
        const b = Buffer.from(expectedSecret);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
      }

      case "retell": {
        const signature = request.headers.get("x-retell-signature");
        const expectedSecret = process.env.RETELL_WEBHOOK_SECRET;
        if (!signature || !expectedSecret) return false;

        const clonedRequest = request.clone();
        const body = await clonedRequest.text();
        const expected = createHmac("sha256", expectedSecret).update(body).digest("base64");

        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
      }

      default:
        return false;
    }
  } catch {
    return false;
  }
}
