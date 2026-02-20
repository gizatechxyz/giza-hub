import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent } from '@gizatech/agent-sdk';
import { CHAIN_NAMES } from '@gizatech/agent-sdk';
import type { WalletContextStore } from '../context.js';
import { formatToolError } from '../errors.js';
import { formatAddress, textResponse } from '../format.js';

export function registerAccountTools(
  server: McpServer,
  sdk: GizaAgent,
  walletStore: WalletContextStore,
  sessionId: string,
): void {
  server.tool(
    'create_smart_account',
    'Create a new smart account for yield optimization',
    {},
    async () => {
      try {
        const originWallet = walletStore.requireWallet(sessionId);
        const account = await sdk.agent.createSmartAccount({
          origin_wallet: originWallet,
        });
        const chainName =
          CHAIN_NAMES[sdk.getChainId()] ?? String(sdk.getChainId());

        return textResponse(
          [
            `Smart account created on ${chainName}.`,
            '',
            `Address: ${formatAddress(account.smartAccountAddress)}`,
            `Full address: ${account.smartAccountAddress}`,
            '',
            'Next steps:',
            '1. Deposit funds to your smart account address above',
            '2. Use activate_agent with the deposit transaction hash to start earning yield',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'get_smart_account',
    'Get details about your smart account',
    {},
    async () => {
      try {
        const originWallet = walletStore.requireWallet(sessionId);
        const account = await sdk.agent.getSmartAccount({
          origin_wallet: originWallet,
        });
        const chainName =
          CHAIN_NAMES[sdk.getChainId()] ?? String(sdk.getChainId());

        return textResponse(
          [
            `Smart account on ${chainName}:`,
            '',
            `Address: ${formatAddress(account.smartAccountAddress)}`,
            `Full address: ${account.smartAccountAddress}`,
            `Owner: ${formatAddress(account.origin_wallet)}`,
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
