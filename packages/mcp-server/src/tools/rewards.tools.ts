import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent, Address } from '@gizatech/agent-sdk';
import { formatToolError } from '../errors.js';
import { formatAddress, formatUsd, formatPercent, textResponse } from '../format.js';

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export function registerRewardsTools(
  server: McpServer,
  sdk: GizaAgent,
): void {
  server.tool(
    'get_fees',
    'View the fee structure for your smart account',
    { smart_account_address: addressSchema },
    async ({ smart_account_address }) => {
      try {
        const fees = await sdk.agent.getFees(
          smart_account_address as Address,
        );

        return textResponse(
          [
            `Fees for ${formatAddress(smart_account_address)}:`,
            '',
            `Fee rate: ${formatPercent(fees.percentage_fee)}`,
            `Current fee: ${formatUsd(fees.fee)}`,
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'claim_rewards',
    'Claim accumulated protocol rewards',
    { smart_account_address: addressSchema },
    async ({ smart_account_address }) => {
      try {
        const { rewards } = await sdk.agent.claimRewards(
          smart_account_address as Address,
        );

        if (rewards.length === 0) {
          return textResponse(
            'No rewards available to claim at this time.',
          );
        }

        const lines: string[] = [
          `Rewards claimed for ${formatAddress(smart_account_address)}:`,
          '',
        ];

        for (const reward of rewards) {
          lines.push(
            `  - ${reward.amount_float} (${formatAddress(reward.token)})`,
          );
        }

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
