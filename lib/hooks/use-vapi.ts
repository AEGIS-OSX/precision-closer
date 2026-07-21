'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getVapi } from '@/lib/vapi';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'error';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface UseVapiReturn {
  status: CallStatus;
  transcript: TranscriptEntry[];
  error: string | null;
  isMicDenied: boolean;
  startCall: (assistantId: string) => Promise<void>;
  endCall: () => Promise<void>;
}

export function useVapi(): UseVapiReturn {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMicDenied, setIsMicDenied] = useState(false);

  // Keep a stable ref to the vapi instance so listeners can be cleaned up.
  const vapiRef = useRef<import('@vapi-ai/web').default | null>(null);

  const cleanupListeners = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    vapi.off('call-start', handleCallStart);
    vapi.off('call-end', handleCallEnd);
    vapi.off('speech-start', handleSpeechStart);
    vapi.off('speech-end', handleSpeechEnd);
    vapi.off('message', handleMessage);
    vapi.off('error', handleError);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable handler references so we can remove them by identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCallStart = useCallback(() => {
    setStatus('active');
    setError(null);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCallEnd = useCallback(() => {
    setStatus('idle');
    cleanupListeners();
  }, [cleanupListeners]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSpeechStart = useCallback(() => {
    // Reserved for future UI feedback (e.g. waveform animation).
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSpeechEnd = useCallback(() => {
    // Reserved for future UI feedback.
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMessage = useCallback((message: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
    if (message.type === 'transcript' && message.transcriptType === 'final' && message.transcript) {
      setTranscript((prev) => [
        ...prev,
        {
          role: (message.role as 'user' | 'assistant') ?? 'assistant',
          text: message.transcript!,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message.toLowerCase().includes('permission') ||
      message.toLowerCase().includes('notallowed') ||
      message.toLowerCase().includes('mic')
    ) {
      setIsMicDenied(true);
    }

    setError(message);
    setStatus('error');
    cleanupListeners();
  }, [cleanupListeners]);

  const startCall = useCallback(
    async (assistantId: string) => {
      try {
        setStatus('connecting');
        setError(null);
        setIsMicDenied(false);
        setTranscript([]);

        const vapi = await getVapi();
        vapiRef.current = vapi;

        vapi.on('call-start', handleCallStart);
        vapi.on('call-end', handleCallEnd);
        vapi.on('speech-start', handleSpeechStart);
        vapi.on('speech-end', handleSpeechEnd);
        vapi.on('message', handleMessage);
        vapi.on('error', handleError);

        await vapi.start(assistantId);
      } catch (err) {
        handleError(err);
      }
    },
    [handleCallStart, handleCallEnd, handleSpeechStart, handleSpeechEnd, handleMessage, handleError]
  );

  const endCall = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    try {
      setStatus('ending');
      await vapi.stop();
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

  return {
    status,
    transcript,
    error,
    isMicDenied,
    startCall,
    endCall,
  };
}
