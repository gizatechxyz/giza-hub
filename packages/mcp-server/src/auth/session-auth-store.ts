import type { AuthContext } from './types.js';
import {
  SESSION_AUTH_TTL_MS,
  MAX_SESSION_AUTH_ENTRIES,
  MAX_PENDING_DEVICES,
} from '../constants.js';
import { BoundedMap } from '../utils/bounded-map.js';

const store = new BoundedMap<string, AuthContext>(MAX_SESSION_AUTH_ENTRIES, SESSION_AUTH_TTL_MS);
const pendingDevices = new BoundedMap<string, boolean>(MAX_PENDING_DEVICES, SESSION_AUTH_TTL_MS);

export function createDeviceSession(sessionId: string): void {
  pendingDevices.set(sessionId, true);
}

export function completeDeviceSession(
  sessionId: string,
  ctx: AuthContext,
): void {
  if (!pendingDevices.has(sessionId)) {
    throw new Error('No pending device session');
  }
  pendingDevices.delete(sessionId);
  setSessionAuth(sessionId, ctx);
}

export function setSessionAuth(
  sessionId: string,
  ctx: AuthContext,
): void {
  store.set(sessionId, ctx);
}

export function getSessionAuth(
  sessionId: string,
): AuthContext | undefined {
  return store.get(sessionId);
}
