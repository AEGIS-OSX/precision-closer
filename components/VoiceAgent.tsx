'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '';

export default function VoiceAgent() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      setCallState('error');
      setErrorMessage('VAPI public key is not configured. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY in your environment.');
      return;
    }

    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setCallState('active');
      setErrorMessage(null);
    });

    vapi.on('call-end', () => {
      setCallState('ended');
    });

    vapi.on('speech-start', () => {
      // User started speaking
    });

    vapi.on('speech-end', () => {
      // User stopped speaking
    });

    vapi.on('message', (message) => {
      // Handle transcript or other messages from the assistant
      void message;
    });

    vapi.on('error', (error) => {
      setCallState('error');
      setErrorMessage(error?.message || 'An error occurred during the call');
    });

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, []);

  const toggleCall = useCallback(async () => {
    if (!vapiRef.current) return;

    if (callState === 'active') {
      vapiRef.current.stop();
      setCallState('ended');
    } else if (callState === 'idle' || callState === 'ended' || callState === 'error') {
      if (!VAPI_ASSISTANT_ID) {
        setCallState('error');
        setErrorMessage('VAPI assistant ID is not configured. Set NEXT_PUBLIC_VAPI_ASSISTANT_ID in your environment.');
        return;
      }
      setCallState('connecting');
      setErrorMessage(null);
      try {
        await vapiRef.current.start(VAPI_ASSISTANT_ID);
      } catch (err) {
        setCallState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to start call');
      }
    }
  }, [callState]);

  const getButtonStyles = (): string => {
    switch (callState) {
      case 'idle':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'connecting':
        return 'bg-yellow-500 text-white cursor-wait';
      case 'active':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'ended':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'error':
        return 'bg-red-800 hover:bg-red-900 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getStatusText = (): string => {
    switch (callState) {
      case 'idle':
        return 'Start Call';
      case 'connecting':
        return 'Connecting...';
      case 'active':
        return 'End Call';
      case 'ended':
        return 'Call Ended — Start New Call';
      case 'error':
        return 'Error — Retry';
      default:
        return 'Start Call';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            callState === 'active'
              ? 'bg-green-500 animate-pulse'
              : callState === 'connecting'
              ? 'bg-yellow-500 animate-pulse'
              : callState === 'error'
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-700">
          {callState === 'idle' && 'Ready'}
          {callState === 'connecting' && 'Connecting...'}
          {callState === 'active' && 'On Call'}
          {callState === 'ended' && 'Call Ended'}
          {callState === 'error' && 'Error'}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleCall}
        disabled={callState === 'connecting'}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${getButtonStyles()}`}
        aria-label={getStatusText()}
      >
        {getStatusText()}
      </button>

      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md max-w-md text-center">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
