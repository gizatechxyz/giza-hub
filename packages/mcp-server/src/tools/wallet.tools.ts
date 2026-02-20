import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent, Address } from '@gizatech/agent-sdk';
import type { WalletContextStore } from '../context.js';
import { formatToolError } from '../errors.js';
import { formatAddress, textResponse } from '../format.js';

export function registerWalletTools(
  server: McpServer,
  sdk: GizaAgent,
  walletStore: WalletContextStore,
  sessionId: string,
): void {
  server.tool(
    'connect_wallet',
    'Connect a wallet to start managing DeFi yield optimization',
    { wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address') },
    async ({ wallet_address }) => {
      try {
        walletStore.set(sessionId, wallet_address as Address);

        let smartAccountInfo = '';
        try {
          const account = await sdk.agent.getSmartAccount({
            origin_wallet: wallet_address as Address,
          });
          smartAccountInfo = [
            '',
            `Smart account found: ${formatAddress(account.smartAccountAddress)}`,
            '',
            'You can check your portfolio, activate your agent, or manage your positions.',
          ].join('\n');
        } catch {
          smartAccountInfo = [
            '',
            'No smart account found for this wallet yet.',
            '',
            'To get started, use create_smart_account to set up your yield optimization account.',
          ].join('\n');
        }

        return textResponse(
          `Wallet ${formatAddress(wallet_address)} connected.${smartAccountInfo}`,
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'disconnect_wallet',
    'Disconnect the current wallet from this session',
    {},
    async () => {
      walletStore.remove(sessionId);
      return textResponse(
        'Wallet disconnected. Use connect_wallet to connect a different wallet.',
      );
    },
  );
}
