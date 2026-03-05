import type { AuthContext } from './types.js';
import { SESSION_AUTH_TTL_MS } from '../constants.js';

interface SessionEntry {
  ctx: AuthContext;
  createdAt: number;
}

const store = new Map<string, SessionEntry>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > SESSION_AUTH_TTL_MS) {
      store.delete(id);
    }
  }
}

export function setSessionAuth(
  sessionId: string,
  ctx: AuthContext,
): void {
  sweepExpired();
  store.set(sessionId, { ctx, createdAt: Date.now() });
}

export function getSessionAuth(
  sessionId: string,
): AuthContext | undefined {
  const entry = store.get(sessionId);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > SESSION_AUTH_TTL_MS) {
    store.delete(sessionId);
    return undefined;
  }
  return entry.ctx;
}

export function clearSessionAuth(sessionId: string): void {
  store.delete(sessionId);
}
