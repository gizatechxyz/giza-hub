import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema, paginationSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

export function registerTransactionTools(server: McpServer): void {
  server.registerTool(
    'giza_list_transactions',
    {
      title: 'List Transactions',
      description:
        'List transaction history (rebalances, deposits, withdrawals). Use for "what happened" questions.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'List optimization runs with status. Use for detailed history or debugging.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Get logs for a specific execution. Requires executionId from giza_list_executions. For debugging.',
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
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Get all agent logs. For debugging. Prefer giza_list_transactions for user-facing history.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.logs({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );
}
