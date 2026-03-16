import { Period } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

export function registerMonitoringTools(server: McpServer): void {
  server.registerTool(
    'giza_get_portfolio',
    {
      title: 'Get Portfolio',
      description:
        'Get your current portfolio: total value, balances, and how your funds are allocated across protocols.',
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
        'Get historical performance data over time. Use the APR tool for a simple summary instead.',
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
        'Get your annualized return rate (APR). Best for yield and return questions.',
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
        'Get your return rate broken down by token.',
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
        'See your deposit history.',
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
