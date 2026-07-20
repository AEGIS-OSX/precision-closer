'use client';

import { useEffect, useState } from 'react';
import { useLiveSession } from '@/lib/live-session-context';

type BridgeState = 'loading' | 'active' | 'waiting' | 'error';

interface JoinRouteProps {
  sessionId: string;
}

export function JoinRoute({ sessionId }: JoinRouteProps) {
  const { getSession } = useLiveSession();
  const [state, setState] = useState<
    BridgeState>(() => {
      try {
        const session = getSession(sessionId);
        if (session && session.status === 'active') return 'active';
        return 'waiting';
      } catch {
        return 'error';
      }
    });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const session = getSession(sessionId);

      if (!cancelled) {
        if (session && session.status === 'active') {
          setState('active');
        } else {
          setState('waiting');
        }
      }
    } catch (err) {
      if (!cancelled) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unexpected error while joining session'
        );
        setState('error');
      }
    }

    return () => {
      cancelled = true;
    };
  }, [sessionId, getSession]);

  if (state === 'loading') {
    return (
      <main role="main" aria-label="Joining live session">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Joining session...
            </h1>
            <div
              className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-gray-600">
              Please wait while we connect you.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (state === 'error') {
    return (
      <main role="main" aria-label="Join session error">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-red-700">
              Unable to join
            </h1>
            <p className="mt-2 text-gray-700">
              {errorMessage || 'Something went wrong.'}
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return home
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (state === 'waiting') {
    return (
      <main role="main" aria-label="Waiting for live session">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Waiting for host
            </h1>
            <p className="mt-2 text-gray-600">
              Session{' '}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm">
                {sessionId}
              </code>{' '}
              is not live yet.
            </p>
            <div
              className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-gray-500">
              The page will update automatically when the session starts.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // state === 'active' — seamless takeover
  return (
    <main role="main" aria-label="Live session">
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-white px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Live Session
          </h1>
          <p className="text-sm text-gray-600">
            Session ID:{' '}
            <code className="font-mono">{sessionId}</code>
          </p>
        </header>
        <section className="flex-1 bg-gray-50 p-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="font-medium text-gray-900">
              You have joined the live session.
            </p>
            <p className="mt-2 text-gray-600">
              Stream state is preserved. No full reload occurred.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
