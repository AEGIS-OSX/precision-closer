"use client";

import { useVapi } from "@/lib/hooks/use-vapi";

interface VapiCallWidgetProps {
  /** VAPI assistant ID to connect to when the call starts. */
  assistantId: string;
  /** Optional CSS class override for the container. */
  className?: string;
}

/**
 * VapiCallWidget -- minimal client-side voice agent UI.
 * Exposes start/stop controls, live status, transcript feed, and error states.
 * Styled with project CSS custom properties from app/globals.css.
 */
export default function VapiCallWidget({ assistantId, className = "" }: VapiCallWidgetProps) {
  const { status, sessionId, transcript, error, startCall, endCall } = useVapi();

  const isIdle = status === "idle";
  const isConnecting = status === "connecting";
  const isActive = status === "active";
  const isEnding = status === "ending";
  const isError = status === "error";
  const isBusy = isConnecting || isEnding;

  const statusLabel: Record<typeof status, string> = {
    idle: "Ready",
    connecting: "Connecting…",
    active: "Live",
    ending: "Ending…",
    error: "Error",
  };

  return (
    <div
      className={`flex flex-col gap-[var(--space-base)] p-[calc(var(--space-base)*3)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-primary)] ${className}`}
      role="region"
      aria-label="AI Voice Agent"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          AI Voice Agent
        </span>
        <span
          className="text-xs px-2 py-1 rounded-[var(--radius-sm)]"
          style={{
            background: isActive
              ? "rgba(26,107,255,0.15)"
              : isError
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.05)",
            color: isActive
              ? "var(--color-accent)"
              : isError
              ? "#ef4444"
              : "var(--color-muted)",
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {statusLabel[status]}
        </span>
      </div>

      {/* Session ID (shown when active) */}
      {sessionId && (
        <p
          className="text-xs"
          style={{ color: "var(--color-muted)" }}
          aria-label={`Session ID: ${sessionId}`}
        >
          Session: {sessionId}
        </p>
      )}

      {/* Error state */}
      {isError && error && (
        <div
          role="alert"
          className="rounded-[var(--radius-sm)] p-[calc(var(--space-base)*1.5)] text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Transcript feed */}
      {transcript.length > 0 && (
        <div
          className="flex flex-col gap-[calc(var(--space-base)*0.5)] max-h-48 overflow-y-auto"
          aria-label="Call transcript"
          aria-live="polite"
        >
          {transcript.map((entry, i) => (
            <div
              key={i}
              className="text-xs"
              style={{
                color:
                  entry.role === "assistant"
                    ? "var(--color-accent)"
                    : "var(--color-text)",
              }}
            >
              <span className="font-medium">
                {entry.role === "assistant" ? "Agent" : "You"}:
              </span>{" "}
              {entry.text}
            </div>
          ))}
        </div>
      )}

      {/* Empty transcript placeholder when active */}
      {isActive && transcript.length === 0 && (
        <p
          className="text-xs"
          style={{ color: "var(--color-muted)" }}
          aria-live="polite"
        >
          Listening…
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-[calc(var(--space-base)*1.5)] mt-[calc(var(--space-base)*0.5)]">
        {(isIdle || isError) && (
          <button
            type="button"
            onClick={() => startCall(assistantId)}
            disabled={isBusy}
            className="flex-1 py-2 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition-opacity"
            style={{
              background: "var(--color-accent)",
              color: "#ffffff",
              opacity: isBusy ? 0.5 : 1,
              cursor: isBusy ? "not-allowed" : "pointer",
            }}
            aria-label="Start voice call"
          >
            Start Call
          </button>
        )}

        {(isActive || isConnecting) && (
          <button
            type="button"
            onClick={endCall}
            disabled={isEnding}
            className="flex-1 py-2 px-4 rounded-[var(--radius-sm)] text-sm font-medium transition-opacity"
            style={{
              background: "#ef4444",
              color: "#ffffff",
              opacity: isEnding ? 0.5 : 1,
              cursor: isEnding ? "not-allowed" : "pointer",
            }}
            aria-label="End voice call"
          >
            {isConnecting ? "Connecting…" : "End Call"}
          </button>
        )}

        {isEnding && (
          <span
            className="flex-1 py-2 px-4 text-center text-sm"
            style={{ color: "var(--color-muted)" }}
            aria-live="polite"
          >
            Ending call…
          </span>
        )}
      </div>
    </div>
  );
}
