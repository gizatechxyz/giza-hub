import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { ensureAuth, checkAuth } from '../auth/ensure-auth.js';
import { getBaseUrl } from '../constants.js';

export function registerProtectedTools(server: McpServer): void {
  server.registerTool(
    'giza_login',
    {
      title: 'Login',
      description:
        'Authenticate with Giza. If already authenticated, returns wallet info. Otherwise, returns a login URL for the user to open. Call again after the user has logged in.',
      inputSchema: z.object({}),
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
        'Returns the authenticated wallet address and user info. Returns an error if not authenticated — call giza_login first.',
      inputSchema: z.object({}),
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
