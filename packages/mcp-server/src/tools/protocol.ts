import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { jsonResult } from '../format.js';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const getProtocols: ToolDefinition = {
  name: 'get_protocols',
  description:
    'Get the list of active DeFi protocols available for a given token address.',
  inputSchema: z.object({
    token: z.string().regex(ADDRESS_RE, 'Invalid token address'),
  }),
  async handler(ctx, input) {
    const token = input['token'] as `0x${string}`;
    const result = await ctx.giza.protocols(token);
    return jsonResult(result);
  },
};

const getTokens: ToolDefinition = {
  name: 'get_tokens',
  description:
    'Get the list of tokens available on the configured chain, ' +
    'including address, symbol, decimals, balance, and current price.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const result = await ctx.giza.tokens();
    return jsonResult(result);
  },
};

const getStats: ToolDefinition = {
  name: 'get_stats',
  description:
    'Get aggregate chain statistics: total balance, deposits, ' +
    'users, transactions, APR, and liquidity distribution.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const result = await ctx.giza.stats();
    return jsonResult(result);
  },
};

const getTvl: ToolDefinition = {
  name: 'get_tvl',
  description: 'Get the total value locked (TVL) on the configured chain.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const result = await ctx.giza.tvl();
    return jsonResult(result);
  },
};

export const protocolTools: ToolDefinition[] = [
  getProtocols,
  getTokens,
  getStats,
  getTvl,
];
