import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types';
import { extractAuthContext } from './types';
import { checkRevocation } from './session';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function checkAuth(extra: ToolExtra): AuthContext | null {
  return extractAuthContext(extra.authInfo) ?? null;
}

export async function ensureAuth(extra: ToolExtra): Promise<AuthContext> {
  const ctx = checkAuth(extra);
  if (!ctx) {
    throw new Error('Not authenticated. Please log in and try again.');
  }
  await checkRevocation(ctx.privyUserId, ctx.tokenIssuedAt);
  return ctx;
}

export async function ensureAuthWithToken(extra: ToolExtra): Promise<AuthContext> {
  const ctx = await ensureAuth(extra);
  if (!ctx.privyIdToken) {
    throw new Error('Session does not include an identity token. Please log in again.');
  }
  return ctx;
}
