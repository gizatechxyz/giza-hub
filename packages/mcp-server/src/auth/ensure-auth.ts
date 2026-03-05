import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types.js';
import { extractAuthContext } from './types.js';
import { getSessionAuth } from './session-auth-store.js';
import {
  AUTH_POLL_INTERVAL_MS,
  AUTH_POLL_TIMEOUT_MS,
} from '../constants.js';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function ensureAuth(
  extra: ToolExtra,
  baseUrl: string,
): Promise<AuthContext> {
  const fromToken = extractAuthContext(extra.authInfo);
  if (fromToken) return fromToken;

  if (extra.sessionId) {
    const fromSession = getSessionAuth(extra.sessionId);
    if (fromSession) return fromSession;
  }

  if (!extra.sessionId) {
    throw new Error(
      'Authentication required. No session ID available for device login.',
    );
  }

  const loginUrl = `${baseUrl}/login?session=${encodeURIComponent(extra.sessionId)}`;

  await extra.sendNotification({
    method: 'notifications/message',
    params: {
      level: 'warning',
      data: `Authentication required. Please open this URL to log in:\n${loginUrl}`,
    },
  });

  const deadline = Date.now() + AUTH_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    extra.signal?.throwIfAborted();
    await sleep(AUTH_POLL_INTERVAL_MS, extra.signal);

    const ctx = getSessionAuth(extra.sessionId);
    if (ctx) return ctx;
  }

  throw new Error(
    'Login timed out after 5 minutes. Please try again.',
  );
}
