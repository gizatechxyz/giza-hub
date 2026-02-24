import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { jsonResult, textResult } from '../format.js';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const activateAgent: ToolDefinition = {
  name: 'activate_agent',
  description:
    'Activate a Giza yield agent. Requires a connected wallet. ' +
    'Provide the owner EOA, token address, selected protocols, ' +
    'and the deposit transaction hash.',
  inputSchema: z.object({
    owner: z.string().regex(ADDRESS_RE, 'Invalid owner address'),
    token: z.string().regex(ADDRESS_RE, 'Invalid token address'),
    protocols: z.array(z.string()).min(1, 'At least one protocol required'),
    txHash: z.string().min(1, 'Transaction hash required'),
    constraints: z
      .array(
        z.object({
          kind: z.string(),
          params: z.record(z.unknown()),
        }),
      )
      .optional(),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.activate({
      owner: input['owner'] as `0x${string}`,
      token: input['token'] as `0x${string}`,
      protocols: input['protocols'] as string[],
      txHash: input['txHash'] as string,
      constraints: input['constraints'] as
        | Array<{ kind: string; params: Record<string, unknown> }>
        | undefined,
    });
    return jsonResult(result);
  },
};

const deactivateAgent: ToolDefinition = {
  name: 'deactivate_agent',
  description:
    'Deactivate the yield agent. Requires a connected wallet. ' +
    'Optionally transfer remaining funds back to owner.',
  inputSchema: z.object({
    transfer: z.boolean().optional().default(true),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.deactivate({
      transfer: input['transfer'] as boolean | undefined,
    });
    return textResult(result.message);
  },
};

const topUp: ToolDefinition = {
  name: 'top_up',
  description:
    'Top up the yield agent with additional funds. ' +
    'Requires a connected wallet and the deposit transaction hash.',
  inputSchema: z.object({
    txHash: z.string().min(1, 'Transaction hash required'),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.topUp(input['txHash'] as string);
    return textResult(result.message);
  },
};

const runAgent: ToolDefinition = {
  name: 'run_agent',
  description:
    'Trigger a yield optimization execution for the agent. ' +
    'Requires a connected wallet.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.run();
    return jsonResult(result);
  },
};

export const lifecycleTools: ToolDefinition[] = [
  activateAgent,
  deactivateAgent,
  topUp,
  runAgent,
];
