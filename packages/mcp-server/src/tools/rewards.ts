import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { jsonResult } from '../format.js';

const claimRewards: ToolDefinition = {
  name: 'claim_rewards',
  description:
    'Claim available rewards for the connected wallet. ' +
    'Returns the list of claimed reward tokens and amounts.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.claimRewards();
    return jsonResult(result);
  },
};

export const rewardsTools: ToolDefinition[] = [claimRewards];
