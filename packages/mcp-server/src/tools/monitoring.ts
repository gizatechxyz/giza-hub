import { Period } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { requireAuth } from '../auth/types.js';
import { chainSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { getAgentForSession } from '../services/sdk-factory.js';

export function registerMonitoringTools(server: McpServer): void {
  server.registerTool(
    'giza_get_portfolio',
    {
      title: 'Get Portfolio',
      description:
        'Get the current portfolio overview for the agent, including deposits, status, and protocol allocations.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.portfolio();
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_performance',
    {
      title: 'Get Performance',
      description:
        'Get historical performance chart data for the agent, with optional start date filter.',
      inputSchema: z.object({
        chain: chainSchema,
        from: z
          .string()
          .optional()
          .describe('Start date for performance data (ISO 8601)'),
      }),
    },
    async ({ chain, from }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.performance({ from });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_apr',
    {
      title: 'Get APR',
      description:
        'Get the annualized percentage return (APR) for the agent, with optional date range filtering.',
      inputSchema: z.object({
        chain: chainSchema,
        startDate: z
          .string()
          .optional()
          .describe('Start date (ISO 8601)'),
        endDate: z
          .string()
          .optional()
          .describe('End date (ISO 8601)'),
        useExactEndDate: z
          .boolean()
          .optional()
          .describe('Use exact end date instead of rounding'),
      }),
    },
    async ({ chain, startDate, endDate, useExactEndDate }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.apr({ startDate, endDate, useExactEndDate });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_apr_by_tokens',
    {
      title: 'Get APR by Tokens',
      description:
        'Get APR data broken down by individual tokens, with optional time period filter.',
      inputSchema: z.object({
        chain: chainSchema,
        period: z
          .nativeEnum(Period)
          .optional()
          .describe("Time period: 'all' or 'day'"),
      }),
    },
    async ({ chain, period }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.aprByTokens(period);
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_deposits',
    {
      title: 'Get Deposits',
      description:
        'Get the list of deposits made to the agent smart account.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.deposits();
        },
        jsonResult,
      ),
  );
}
