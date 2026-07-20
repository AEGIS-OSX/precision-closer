// VAPI Web SDK client -- browser-only, loaded dynamically to avoid SSR issues.
// Uses NEXT_PUBLIC_VAPI_PUBLIC_KEY (client-side public key).
// Never import this file in server components or API routes.

export type VapiCallStatus = "idle" | "connecting" | "active" | "ending" | "error";

export interface VapiTranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface VapiError {
  code: string;
  message: string;
}

export interface VapiCallState {
  status: VapiCallStatus;
  sessionId: string | null;
  transcript: VapiTranscriptEntry[];
  error: VapiError | null;
}

// Minimal type shim for the VAPI Web SDK.
// The real types come from @vapi-ai/web once installed.
export interface VapiSDK {
  start(assistantId: string): Promise<void>;
  stop(): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

let vapiInstance: VapiSDK | null = null;

/**
 * Lazily load and initialise the VAPI Web SDK.
 * Returns null if NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set.
 * Throws if the dynamic import fails (network / bundle error).
 */
export async function getVapiClient(): Promise<VapiSDK | null> {
  if (typeof window === "undefined") return null;

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  if (!publicKey) {
    // Key not configured -- return null so callers can surface a config error.
    return null;
  }

  if (vapiInstance) return vapiInstance;

  // Dynamic import keeps the SDK out of the server bundle.
  const { default: Vapi } = await import("@vapi-ai/web");
  vapiInstance = new Vapi(publicKey) as unknown as VapiSDK;
  return vapiInstance;
}

/**
 * Reset the singleton (used in tests and after a fatal error).
 */
export function resetVapiClient(): void {
  vapiInstance = null;
}
