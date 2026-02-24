import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { jsonResult, textResult, formatAddress } from '../format.js';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const createSmartAccount: ToolDefinition = {
  name: 'create_smart_account',
  description:
    'Create a new Giza smart account for the given EOA (externally owned account). ' +
    'Returns the smart account address. Also connects the wallet to this session.',
  inputSchema: z.object({
    eoa: z.string().regex(ADDRESS_RE, 'Invalid Ethereum address'),
  }),
  async handler(ctx, input) {
    const eoa = input['eoa'] as `0x${string}`;
    const agent = await ctx.giza.createAgent(eoa);
    ctx.walletStore.set(ctx.sessionId, agent.wallet);
    return textResult(
      `Smart account created: ${formatAddress(agent.wallet)}. ` +
        `Wallet connected to session.`,
    );
  },
};

const getSmartAccount: ToolDefinition = {
  name: 'get_smart_account',
  description:
    'Look up the smart account associated with an EOA. ' +
    'Returns full account info including smart account address, ' +
    'backend wallet, and chain.',
  inputSchema: z.object({
    eoa: z.string().regex(ADDRESS_RE, 'Invalid Ethereum address'),
  }),
  async handler(ctx, input) {
    const eoa = input['eoa'] as `0x${string}`;
    const info = await ctx.giza.getSmartAccount(eoa);
    return jsonResult(info);
  },
};

export const accountTools: ToolDefinition[] = [
  createSmartAccount,
  getSmartAccount,
];
