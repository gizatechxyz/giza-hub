import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuthWithToken } from '../auth/ensure-auth';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { executePendingOperation } from '../services/confirmation';
import { ANNOTATIONS_DESTRUCTIVE } from '../constants';

export function registerCriticalTools(server: McpServer): void {
  server.registerTool(
    'giza_confirm_operation',
    {
      title: 'Confirm Critical Operation',
      description:
        'Confirm and execute a pending operation (withdraw, deactivate, or claim rewards). Only call after the user explicitly confirms.',
      inputSchema: z.object({
        confirmationToken: z
          .string()
          .uuid()
          .describe('The confirmation token from the initiated operation'),
      }),
      annotations: ANNOTATIONS_DESTRUCTIVE,
    },
    async ({ confirmationToken }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuthWithToken(extra);
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
