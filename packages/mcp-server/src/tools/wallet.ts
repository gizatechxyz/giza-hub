import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { textResult } from '../format.js';
import { formatAddress } from '../format.js';

const connectWallet: ToolDefinition = {
  name: 'connect_wallet',
  description:
    'Connect a wallet address to this session. ' +
    'All subsequent agent operations will use this wallet. ' +
    'The address must be a valid Ethereum address (0x-prefixed, 40 hex chars).',
  inputSchema: z.object({
    wallet: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  }),
  async handler(ctx, input) {
    const wallet = input['wallet'] as `0x${string}`;
    ctx.walletStore.set(ctx.sessionId, wallet);
    return textResult(
      `Wallet ${formatAddress(wallet)} connected to session.`,
    );
  },
};

const disconnectWallet: ToolDefinition = {
  name: 'disconnect_wallet',
  description: 'Disconnect the wallet from this session.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const had = ctx.walletStore.delete(ctx.sessionId);
    return textResult(
      had
        ? 'Wallet disconnected from session.'
        : 'No wallet was connected to this session.',
    );
  },
};

export const walletTools: ToolDefinition[] = [
  connectWallet,
  disconnectWallet,
];
