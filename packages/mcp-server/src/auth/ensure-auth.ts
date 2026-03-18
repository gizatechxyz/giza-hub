import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types';
import { extractAuthContext } from './types';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function checkAuth(extra: ToolExtra): AuthContext | null {
  return extractAuthContext(extra.authInfo) ?? null;
}

export function ensureAuth(extra: ToolExtra): AuthContext {
  const ctx = checkAuth(extra);
  if (!ctx) {
    throw new Error('Not authenticated. Please log in and try again.');
  }
  return ctx;
}

export function ensureAuthWithToken(extra: ToolExtra): AuthContext {
  const ctx = ensureAuth(extra);
  if (!ctx.privyIdToken) {
    throw new Error('Session does not include an identity token. Please log in again.');
  }
  return ctx;
}
