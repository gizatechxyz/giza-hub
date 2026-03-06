import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types.js';
import { extractAuthContext } from './types.js';
import { getSessionAuth } from './session-auth-store.js';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function checkAuth(extra: ToolExtra): AuthContext | null {
  const fromToken = extractAuthContext(extra.authInfo);
  if (fromToken) return fromToken;
  if (extra.sessionId) {
    const fromSession = getSessionAuth(extra.sessionId);
    if (fromSession) return fromSession;
  }
  return null;
}

export function ensureAuth(
  extra: ToolExtra,
  baseUrl: string,
): AuthContext {
  const ctx = checkAuth(extra);
  if (ctx) return ctx;

  if (!extra.sessionId) {
    throw new Error(
      'Authentication required. No session ID available for device login.',
    );
  }

  const loginUrl = `${baseUrl}/login?session=${encodeURIComponent(extra.sessionId)}`;
  throw new Error(
    `Authentication required. Please open this URL to log in:\n${loginUrl}\n\nAfter logging in, call this tool again.`,
  );
}
