import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent, Address } from '@gizatech/agent-sdk';
import type { WalletContextStore } from '../context.js';
import { formatToolError } from '../errors.js';
import { formatAddress, textResponse } from '../format.js';

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export function registerLifecycleTools(
  server: McpServer,
  sdk: GizaAgent,
  walletStore: WalletContextStore,
  sessionId: string,
): void {
  server.tool(
    'activate_agent',
    'Activate the yield optimization agent after depositing funds',
    {
      smart_account_address: addressSchema,
      initial_token: addressSchema.describe('Token address deposited (e.g. USDC)'),
      selected_protocols: z.array(z.string()).min(1, 'Select at least one protocol'),
      tx_hash: z.string().optional().describe('Transaction hash of the deposit'),
      constraints: z
        .array(
          z.object({
            kind: z.string(),
            params: z.record(z.unknown()),
          }),
        )
        .optional()
        .describe('Optional constraints for agent behavior'),
    },
    async ({
      smart_account_address,
      initial_token,
      selected_protocols,
      tx_hash,
      constraints,
    }) => {
      try {
        const originWallet = walletStore.requireWallet(sessionId);
        const result = await sdk.agent.activate({
          wallet: smart_account_address as Address,
          origin_wallet: originWallet,
          initial_token: initial_token as Address,
          selected_protocols,
          tx_hash,
          constraints,
        });

        return textResponse(
          [
            'Agent activated and optimizing your yield.',
            '',
            `Account: ${formatAddress(smart_account_address)}`,
            `Protocols: ${selected_protocols.join(', ')}`,
            '',
            result.message,
            '',
            'Your agent will automatically rebalance across protocols to maximize returns.',
            'Use get_portfolio or get_performance to monitor your position.',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'deactivate_agent',
    'Deactivate the yield optimization agent',
    {
      smart_account_address: addressSchema,
      transfer: z
        .boolean()
        .optional()
        .describe('Transfer remaining balance to your wallet (default: true)'),
    },
    async ({ smart_account_address, transfer }) => {
      try {
        const result = await sdk.agent.deactivate({
          wallet: smart_account_address as Address,
          transfer,
        });

        return textResponse(
          [
            'Agent deactivated.',
            '',
            `Account: ${formatAddress(smart_account_address)}`,
            result.message,
            '',
            transfer !== false
              ? 'Remaining funds will be transferred to your wallet.'
              : 'Funds remain in the smart account.',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'top_up',
    'Add more funds to an active agent',
    {
      smart_account_address: addressSchema,
      tx_hash: z.string().describe('Transaction hash of the new deposit'),
    },
    async ({ smart_account_address, tx_hash }) => {
      try {
        const result = await sdk.agent.topUp({
          wallet: smart_account_address as Address,
          tx_hash,
        });

        return textResponse(
          [
            'Top-up registered.',
            '',
            `Account: ${formatAddress(smart_account_address)}`,
            result.message,
            '',
            'The agent will include the new funds in its next optimization cycle.',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'run_agent',
    'Trigger a manual optimization run for the agent',
    { smart_account_address: addressSchema },
    async ({ smart_account_address }) => {
      try {
        const result = await sdk.agent.run({
          wallet: smart_account_address as Address,
        });

        return textResponse(
          [
            'Agent run triggered.',
            '',
            `Account: ${formatAddress(smart_account_address)}`,
            `Status: ${result.status}`,
            '',
            'The agent will rebalance your positions for optimal yield.',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
