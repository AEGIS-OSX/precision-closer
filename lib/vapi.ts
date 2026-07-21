/**
 * VAPI client singleton.
 * Initialised lazily on first use so the module is safe to import in SSR contexts.
 * The public key is read from NEXT_PUBLIC_VAPI_PUBLIC_KEY (client-side env var).
 */

let vapiInstance: import('@vapi-ai/web').default | null = null;

export async function getVapi(): Promise<import('@vapi-ai/web').default> {
  if (vapiInstance) return vapiInstance;

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error(
      'NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Add it to your .env.local file.'
    );
  }

  // Dynamic import keeps the heavy SDK out of the SSR bundle.
  const { default: Vapi } = await import('@vapi-ai/web');
  vapiInstance = new Vapi(publicKey);
  return vapiInstance;
}

/** Tear down the singleton (useful in tests or hot-reload scenarios). */
export function resetVapi(): void {
  vapiInstance = null;
}
