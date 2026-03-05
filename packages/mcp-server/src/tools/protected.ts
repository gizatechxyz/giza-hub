import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { ensureAuth } from '../auth/ensure-auth.js';
import { getBaseUrl } from '../constants.js';

export function registerProtectedTools(server: McpServer): void {
  server.registerTool(
    'giza_login',
    {
      title: 'Login',
      description:
        'Authenticate with Giza. If already authenticated, returns wallet info. Otherwise, provides a login URL and waits for browser authentication to complete.',
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
        'Returns the authenticated wallet address and user info. Will prompt for login if not authenticated.',
      inputSchema: z.object({}),
    },
    async (_params, extra) =>
      handleToolCall(
        () => ensureAuth(extra, getBaseUrl()),
        (ctx) =>
          jsonResult({
            walletAddress: ctx.walletAddress,
            privyUserId: ctx.privyUserId,
            scopes: ctx.scopes,
          }),
      ),
  );
}
