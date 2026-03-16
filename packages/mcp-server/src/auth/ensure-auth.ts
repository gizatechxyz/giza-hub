import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types';
import { extractAuthContext } from './types';
import { getSessionAuth } from './session-auth-store';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export async function checkAuth(extra: ToolExtra): Promise<AuthContext | null> {
  const fromToken = extractAuthContext(extra.authInfo);
  if (fromToken) return fromToken;
  if (extra.sessionId) {
    try {
      const fromSession = await getSessionAuth(extra.sessionId);
      if (fromSession) return fromSession;
    } catch (cause) {
      throw new Error(
        'Temporary service error — unable to verify session. Please try again shortly.',
        { cause },
      );
    }
  }
  return null;
}

export async function ensureAuth(
  extra: ToolExtra,
  baseUrl: string,
): Promise<AuthContext> {
  const ctx = await checkAuth(extra);
  if (ctx) return ctx;

  if (!extra.sessionId) {
    throw new Error(
      'You need to log in first, but no session is available for login. Please try reconnecting.',
    );
  }

  const loginUrl = `${baseUrl}/api/login?session=${encodeURIComponent(extra.sessionId)}`;
  throw new Error(
    `You need to log in. Open this link in your browser:\n${loginUrl}\n\nOnce you've logged in, try again.`,
  );
}
