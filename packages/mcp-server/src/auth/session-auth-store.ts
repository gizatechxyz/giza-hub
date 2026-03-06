import type { AuthContext } from './types.js';
import { SESSION_AUTH_TTL_MS } from '../constants.js';

interface SessionEntry {
  ctx: AuthContext;
  createdAt: number;
}

interface PendingDevice {
  nonce: string;
  createdAt: number;
}

const store = new Map<string, SessionEntry>();
const pendingDevices = new Map<string, PendingDevice>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > SESSION_AUTH_TTL_MS) {
      store.delete(id);
    }
  }
  for (const [id, entry] of pendingDevices) {
    if (now - entry.createdAt > SESSION_AUTH_TTL_MS) {
      pendingDevices.delete(id);
    }
  }
}

export function createDeviceSession(sessionId: string): string {
  sweepExpired();
  const nonce = crypto.randomUUID();
  pendingDevices.set(sessionId, { nonce, createdAt: Date.now() });
  return nonce;
}

export function completeDeviceSession(
  sessionId: string,
  nonce: string,
  ctx: AuthContext,
): void {
  const pending = pendingDevices.get(sessionId);
  if (!pending) throw new Error('No pending device session');
  if (pending.nonce !== nonce) throw new Error('Device session nonce mismatch');
  if (Date.now() - pending.createdAt > SESSION_AUTH_TTL_MS) {
    pendingDevices.delete(sessionId);
    throw new Error('Device session expired');
  }
  pendingDevices.delete(sessionId);
  setSessionAuth(sessionId, ctx);
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
