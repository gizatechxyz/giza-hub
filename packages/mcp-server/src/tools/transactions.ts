import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { requireAuth } from '../auth/types.js';
import { chainSchema, paginationSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { getAgentForSession } from '../services/sdk-factory.js';

export function registerTransactionTools(server: McpServer): void {
  server.registerTool(
    'giza_list_transactions',
    {
      title: 'List Transactions',
      description:
        'List paginated transactions for the agent. Returns transaction history with action type, amounts, status, and protocol info.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
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
        'List paginated optimization executions for the agent, including their status and associated transactions.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
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
        'List paginated logs for a specific execution run.',
      inputSchema: z.object({
        chain: chainSchema,
        executionId: z.string().describe('Execution ID to get logs for'),
        ...paginationSchema.shape,
      }),
    },
    async ({ chain, executionId, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
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
        'List paginated logs for the agent across all executions.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.logs({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );
}
