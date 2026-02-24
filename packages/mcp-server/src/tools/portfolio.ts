import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { jsonResult } from '../format.js';

const getPortfolio: ToolDefinition = {
  name: 'get_portfolio',
  description:
    'Get the full portfolio info for the connected wallet, including ' +
    'deposits, withdrawals, status, protocols, and activation dates.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.portfolio();
    return jsonResult(result);
  },
};

const getPerformance: ToolDefinition = {
  name: 'get_performance',
  description:
    'Get performance chart data for the connected wallet. ' +
    'Optionally filter from a start date (YYYY-MM-DD).',
  inputSchema: z.object({
    from: z.string().optional(),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.performance({
      from: input['from'] as string | undefined,
    });
    return jsonResult(result);
  },
};

const getApr: ToolDefinition = {
  name: 'get_apr',
  description:
    'Get the APR (Annual Percentage Rate) for the connected wallet. ' +
    'Optionally specify start and end dates.',
  inputSchema: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    useExactEndDate: z.boolean().optional(),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.apr({
      startDate: input['startDate'] as string | undefined,
      endDate: input['endDate'] as string | undefined,
      useExactEndDate: input['useExactEndDate'] as boolean | undefined,
    });
    return jsonResult(result);
  },
};

const getDeposits: ToolDefinition = {
  name: 'get_deposits',
  description: 'Get the list of deposits for the connected wallet.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.deposits();
    return jsonResult(result);
  },
};

export const portfolioTools: ToolDefinition[] = [
  getPortfolio,
  getPerformance,
  getApr,
  getDeposits,
];
