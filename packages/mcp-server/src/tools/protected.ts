import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { ensureAuth } from '../auth/ensure-auth';
import { revokeUserSessions } from '../auth/session';
import { securityLogger } from '../utils/security-logger';
import { ANNOTATIONS_IDEMPOTENT_MUTATING, ANNOTATIONS_MUTATING, ANNOTATIONS_READONLY } from '../constants';

export function registerProtectedTools(server: McpServer): void {
  server.registerTool(
    'giza_login',
    {
      title: 'Login',
      description:
        'Check authentication status. If not authenticated, the user will be prompted to re-login automatically. Try this first when any tool fails with an auth error.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_IDEMPOTENT_MUTATING,
    },
    async (_params, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra);
          return ctx;
        },
        (ctx) =>
          jsonResult({
            status: 'authenticated',
            walletAddress: ctx.walletAddress,
            privyUserId: ctx.privyUserId,
            scopes: ctx.scopes,
          }),
      ),
  );

  server.registerTool(
    'giza_whoami',
    {
      title: 'Who Am I',
      description:
        'Check if you\'re logged in and see your account details.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_READONLY,
    },
    async (_params, extra) =>
      handleToolCall(
        () => ensureAuth(extra),
        (ctx) =>
          jsonResult({
            walletAddress: ctx.walletAddress,
            privyUserId: ctx.privyUserId,
            scopes: ctx.scopes,
          }),
      ),
  );

  server.registerTool(
    'giza_logout',
    {
      title: 'Logout',
      description:
        'Log out and revoke all active sessions. You will need to log in again to use authenticated tools.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_MUTATING,
    },
    async (_params, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra);
          await revokeUserSessions(ctx.privyUserId);
          securityLogger.sessionRevoked({
            privyUserId: ctx.privyUserId,
            clientId: ctx.clientId,
          });
          return {
            status: 'logged_out',
            message: 'All sessions have been revoked. Please log in again to continue.',
          } as const;
        },
        jsonResult,
      ),
  );
}
