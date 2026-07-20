'use client';

import { useEffect } from 'react';

export default function JoinError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error reporting hook point
  }, [error]);

  return (
    <main role="main" aria-label="Join session error">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-700">
            Something went wrong
          </h1>
          <p className="mt-2 text-gray-700">
            We could not connect you to the session.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
