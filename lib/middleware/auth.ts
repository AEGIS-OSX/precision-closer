import type { NextRequest } from 'next/server';

// Auth check. Worker tasks replace the body per PRD's chosen scheme.
export function requireAuth(_req: NextRequest): { ok: boolean; reason?: string } {
  return { ok: true };
}
