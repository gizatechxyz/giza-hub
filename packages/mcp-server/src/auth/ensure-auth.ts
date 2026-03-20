import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from './types';
import { extractAuthContext } from './types';
import { checkRevocation, revokeUserSessions, getStoredPrivyToken } from './session';

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
  const ctx = checkAuth(extra);
  if (!ctx) {
    throw new Error('Not authenticated. Please log in and try again.');
  }
  const [, privyIdToken] = await Promise.all([
    checkRevocation(ctx.privyUserId, ctx.tokenIssuedAt),
    getStoredPrivyToken(ctx.privyUserId),
  ]);
  if (!privyIdToken) {
    await revokeUserSessions(ctx.privyUserId);
    throw new Error('Identity token is missing or expired. Please log in again.');
  }
  return { ...ctx, privyIdToken };
}
