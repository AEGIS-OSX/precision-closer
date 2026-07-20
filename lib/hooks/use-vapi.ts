"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { VapiCallState, VapiTranscriptEntry, VapiError, VapiSDK } from "@/lib/vapi";
import { getVapiClient, resetVapiClient } from "@/lib/vapi";

export interface UseVapiReturn {
  status: VapiCallState["status"];
  sessionId: string | null;
  transcript: VapiTranscriptEntry[];
  error: VapiError | null;
  startCall: (assistantId: string) => Promise<void>;
  endCall: () => void;
}

function logError(context: string, err: unknown): void {
  // Mirror the project's error logging pattern from lib/errors.ts.
  // In production builds, console.error is the project's chosen sink.
  // Replace with a structured logger if one is added to the project.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(`[VAPI ${context}]`, err);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[VAPI ${context}]`, err instanceof Error ? err.message : String(err));
  }
}

export function useVapi(): UseVapiReturn {
  const [state, setState] = useState<VapiCallState>({
    status: "idle",
    sessionId: null,
    transcript: [],
    error: null,
  });

  // Keep a stable ref to the SDK instance so event handlers can access it
  // without stale closures.
  const vapiRef = useRef<VapiSDK | null>(null);

  // Cleanup: remove all listeners and reset state on unmount.
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, []);

  const startCall = useCallback(async (assistantId: string): Promise<void> => {
    setState((prev) => ({ ...prev, status: "connecting", error: null }));

    let vapi: VapiSDK | null;
    try {
      vapi = await getVapiClient();
    } catch (err) {
      const vapiError: VapiError = {
        code: "SDK_LOAD_FAILED",
        message: err instanceof Error ? err.message : "Failed to load VAPI SDK",
      };
      logError("SDK load", err);
      setState((prev) => ({ ...prev, status: "error", error: vapiError }));
      return;
    }

    if (!vapi) {
      const vapiError: VapiError = {
        code: "NOT_CONFIGURED",
        message: "NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Configure it in your environment.",
      };
      logError("config", new Error(vapiError.message));
      setState((prev) => ({ ...prev, status: "error", error: vapiError }));
      return;
    }

    vapiRef.current = vapi;

    // ── Event handlers ──────────────────────────────────────────────────────

    const handleCallStart = () => {
      setState((prev) => ({
        ...prev,
        status: "active",
        sessionId: `vapi_${Date.now()}`,
      }));
    };

    const handleCallEnd = () => {
      setState((prev) => ({ ...prev, status: "idle", sessionId: null }));
      vapiRef.current = null;
    };

    const handleSpeechStart = () => {
      // Speech started -- no state change needed; consumers can extend if required.
    };

    const handleSpeechEnd = () => {
      // Speech ended -- no state change needed.
    };

    const handleMessage = (message: unknown) => {
      // VAPI emits transcript segments via the "message" event.
      const msg = message as Record<string, unknown>;
      if (msg?.type === "transcript") {
        const entry: VapiTranscriptEntry = {
          role: (msg.role as "user" | "assistant") ?? "assistant",
          text: (msg.transcript as string) ?? "",
          timestamp: Date.now(),
        };
        setState((prev) => ({
          ...prev,
          transcript: [...prev.transcript, entry],
        }));
      }
    };

    const handleError = (err: unknown) => {
      const raw = err as Record<string, unknown> | Error | null;
      let vapiError: VapiError;

      if (raw instanceof Error && raw.message.toLowerCase().includes("permission")) {
        vapiError = {
          code: "MIC_PERMISSION_DENIED",
          message: "Microphone permission was denied. Allow microphone access and try again.",
        };
      } else {
        vapiError = {
          code: "VAPI_ERROR",
          message:
            raw instanceof Error
              ? raw.message
              : typeof raw === "object" && raw !== null && typeof raw["message"] === "string"
              ? raw["message"]
              : "An unexpected VAPI error occurred.",
        };
      }

      logError("runtime", err);
      setState((prev) => ({ ...prev, status: "error", error: vapiError }));
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    try {
      await vapi.start(assistantId);
    } catch (err) {
      // start() can throw if mic permission is denied or network fails.
      const raw = err as Error | null;
      let vapiError: VapiError;

      if (raw?.message?.toLowerCase().includes("permission")) {
        vapiError = {
          code: "MIC_PERMISSION_DENIED",
          message: "Microphone permission was denied. Allow microphone access and try again.",
        };
      } else {
        vapiError = {
          code: "START_FAILED",
          message: raw?.message ?? "Failed to start VAPI call.",
        };
      }

      logError("start", err);

      // Remove listeners before setting error state to avoid dangling handlers.
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);

      vapiRef.current = null;
      resetVapiClient();

      setState((prev) => ({ ...prev, status: "error", error: vapiError }));
    }
  }, []);

  const endCall = useCallback((): void => {
    if (!vapiRef.current) return;
    setState((prev) => ({ ...prev, status: "ending" }));
    try {
      vapiRef.current.stop();
    } catch (err) {
      logError("stop", err);
    }
    // call-end event will flip status to idle and null out vapiRef.
  }, []);

  return {
    status: state.status,
    sessionId: state.sessionId,
    transcript: state.transcript,
    error: state.error,
    startCall,
    endCall,
  };
}
