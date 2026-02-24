import { z } from 'zod';
import type { OptimizeOptions } from '@gizatech/agent-sdk';
import type { ToolDefinition } from '../types.js';
import { jsonResult } from '../format.js';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const optimize: ToolDefinition = {
  name: 'optimize',
  description:
    'Run the Giza yield optimizer to find the best allocation across protocols. ' +
    'Provide the token address, total capital (in smallest unit as string), ' +
    'current allocations per protocol, and protocol list. ' +
    'Returns optimal allocations, APR improvement, gas estimates, and action plan.',
  inputSchema: z.object({
    token: z.string().regex(ADDRESS_RE, 'Invalid token address'),
    capital: z.string().min(1, 'Capital amount required'),
    currentAllocations: z.record(z.string()),
    protocols: z.array(z.string()).min(1, 'At least one protocol required'),
    constraints: z
      .array(
        z.object({
          kind: z.string(),
          params: z.record(z.unknown()),
        }),
      )
      .optional(),
    wallet: z
      .string()
      .regex(ADDRESS_RE, 'Invalid wallet address')
      .optional(),
  }),
  async handler(ctx, input) {
    const result = await ctx.giza.optimize({
      token: input['token'],
      capital: input['capital'],
      currentAllocations: input['currentAllocations'],
      protocols: input['protocols'],
      constraints: input['constraints'],
      wallet: input['wallet'],
    } as OptimizeOptions);
    return jsonResult(result);
  },
};

export const optimizerTools: ToolDefinition[] = [optimize];
