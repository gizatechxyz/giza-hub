import type { AuthContext } from './types';
import {
  SESSION_AUTH_TTL_MS,
  MAX_SESSION_AUTH_ENTRIES,
  MAX_PENDING_DEVICES,
} from '../constants';
import { RedisAuthStore } from '../utils/redis-auth-store';

const SESSION_TTL_SEC = Math.floor(SESSION_AUTH_TTL_MS / 1000);

const store = new RedisAuthStore<AuthContext>(
  'giza:session:',
  SESSION_TTL_SEC,
  MAX_SESSION_AUTH_ENTRIES,
);
const pendingDevices = new RedisAuthStore<boolean>(
  'giza:device:',
  SESSION_TTL_SEC,
  MAX_PENDING_DEVICES,
);

export async function createDeviceSession(sessionId: string): Promise<void> {
  await pendingDevices.set(sessionId, true);
}

export async function completeDeviceSession(
  sessionId: string,
  ctx: AuthContext,
): Promise<void> {
  const hasPending = await pendingDevices.has(sessionId);
  if (!hasPending) {
    throw new Error('No pending device session');
  }
  await pendingDevices.delete(sessionId);
  await setSessionAuth(sessionId, ctx);
}

export async function setSessionAuth(
  sessionId: string,
  ctx: AuthContext,
): Promise<void> {
  await store.set(sessionId, ctx);
}

export async function getSessionAuth(
  sessionId: string,
): Promise<AuthContext | undefined> {
  return store.get(sessionId);
}
