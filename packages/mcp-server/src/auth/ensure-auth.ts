import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types';
import { extractAuthContext } from './types';
import { getSessionAuth } from './session-auth-store';

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
      'You need to log in first, but no session is available for login. Please reconnect with a session-capable client.',
    );
  }

  const loginUrl = `${baseUrl}/login?session=${encodeURIComponent(extra.sessionId)}`;
  throw new Error(
    `You need to log in. Open this link in your browser:\n${loginUrl}\n\nOnce you've logged in, try again.`,
  );
}
