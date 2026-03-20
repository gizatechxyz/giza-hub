import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema, paginationSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_READONLY } from '../constants';

export function registerTransactionTools(server: McpServer): void {
  server.registerTool(
    'giza_list_transactions',
    {
      title: 'List Transactions',
      description:
        'See your transaction history including rebalances, deposits, and withdrawals.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.transactions({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_list_executions',
    {
      title: 'List Executions',
      description:
        'See optimization runs and their status. Useful for detailed activity history.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.executions({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_list_execution_logs',
    {
      title: 'List Execution Logs',
      description:
        'Get detailed logs for a specific optimization run.',
      inputSchema: z.object({
        chain: chainSchema,
        executionId: z.string().describe('Execution ID to get logs for'),
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, executionId, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent
            .executionLogs(executionId, { sort })
            .page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_list_logs',
    {
      title: 'List Agent Logs',
      description:
        'Get all account activity logs. For detailed debugging.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.logs({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );
}
