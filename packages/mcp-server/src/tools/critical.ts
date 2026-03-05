import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { executePendingOperation } from '../services/confirmation.js';
import { getBaseUrl } from '../constants.js';

export function registerCriticalTools(server: McpServer): void {
  server.registerTool(
    'giza_confirm_operation',
    {
      title: 'Confirm Critical Operation',
      description:
        'Confirm and execute a previously initiated critical operation (withdraw, deactivate, or claim rewards). Requires the confirmation token returned by the initiating tool.',
      inputSchema: z.object({
        confirmationToken: z
          .string()
          .uuid()
          .describe('The confirmation token from the initiated operation'),
      }),
    },
    async ({ confirmationToken }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const { type, result } = await executePendingOperation(
            confirmationToken,
            ctx.walletAddress,
          );
          return { status: 'executed', operation: type, result };
        },
        jsonResult,
      ),
  );
}
