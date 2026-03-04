import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { requireAuth } from '../auth/types.js';

export function registerProtectedTools(server: McpServer): void {
  server.registerTool(
    'giza_whoami',
    {
      title: 'Who Am I',
      description:
        'Returns the authenticated wallet address and user info. Requires OAuth authentication.',
      inputSchema: z.object({}),
    },
    async (_params, extra) =>
      handleToolCall(
        () => Promise.resolve(requireAuth(extra.authInfo)),
        (ctx) =>
          jsonResult({
            walletAddress: ctx.walletAddress,
            privyUserId: ctx.privyUserId,
            scopes: ctx.scopes,
          }),
      ),
  );
}
