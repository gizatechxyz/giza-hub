import { Period } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth.js';
import { chainSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { getAgentForSession } from '../services/sdk-factory.js';
import { ANNOTATIONS_READONLY, getBaseUrl } from '../constants.js';

export function registerMonitoringTools(server: McpServer): void {
  server.registerTool(
    'giza_get_portfolio',
    {
      title: 'Get Portfolio',
      description:
        'Get the agent\'s current portfolio: value, balances, protocol allocations. Go-to tool for "how is my portfolio" questions.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Get historical performance as time-series data. Use giza_get_apr for a single number summary instead.',
      inputSchema: z.object({
        chain: chainSchema,
        from: z
          .string()
          .optional()
          .describe('Start date for performance data (ISO 8601)'),
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, from }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Get the agent\'s annualized return rate. Best for "what\'s my yield" questions.',
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
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, startDate, endDate, useExactEndDate }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Get APR broken down by token. Use when the user has multiple tokens and wants per-token yield.',
      inputSchema: z.object({
        chain: chainSchema,
        period: z
          .nativeEnum(Period)
          .optional()
          .describe("Time period: 'all' or 'day'"),
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, period }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'List deposits made to the agent. Use for deposit history questions.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.deposits();
        },
        jsonResult,
      ),
  );
}
