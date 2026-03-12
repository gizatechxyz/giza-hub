import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { ensureAuth, checkAuth } from '../auth/ensure-auth';
import { ANNOTATIONS_IDEMPOTENT_MUTATING, ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

export function registerProtectedTools(server: McpServer): void {
  server.registerTool(
    'giza_login',
    {
      title: 'Login',
      description:
        'Authenticate the user. Returns a login URL if not yet logged in — show it to the user. Call again after they log in. Try this first when any tool fails with an auth error.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_IDEMPOTENT_MUTATING,
    },
    async (_params, extra) =>
      handleToolCall(
        () => ensureAuth(extra, getBaseUrl()),
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
        'Check current auth status without triggering login. Returns wallet address if authenticated, error if not.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_READONLY,
    },
    async (_params, extra) =>
      handleToolCall(
        () => {
          const ctx = checkAuth(extra);
          if (!ctx) {
            throw new Error(
              'Not authenticated. Please call giza_login first.',
            );
          }
          return ctx;
        },
        (ctx) =>
          jsonResult({
            walletAddress: ctx.walletAddress,
            privyUserId: ctx.privyUserId,
            scopes: ctx.scopes,
          }),
      ),
  );
}
