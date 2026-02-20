import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent, Address } from '@gizatech/agent-sdk';
import { SortOrder } from '@gizatech/agent-sdk';
import type { WalletContextStore } from '../context.js';
import { formatToolError } from '../errors.js';
import {
  formatAddress,
  formatDate,
  formatUsd,
  formatStatus,
  textResponse,
} from '../format.js';

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export function registerFinancialTools(
  server: McpServer,
  sdk: GizaAgent,
  _walletStore: WalletContextStore,
  _sessionId: string,
): void {
  server.tool(
    'withdraw',
    'Withdraw funds from your yield-optimized position',
    {
      smart_account_address: addressSchema,
      amount: z
        .string()
        .optional()
        .describe(
          'Amount to withdraw (in token smallest unit). Omit for full withdrawal.',
        ),
      transfer: z
        .boolean()
        .optional()
        .describe('Transfer to origin wallet (default: true)'),
    },
    async ({ smart_account_address, amount, transfer }) => {
      try {
        const result = await sdk.agent.withdraw({
          wallet: smart_account_address as Address,
          amount,
          transfer,
        });

        if ('withdraw_details' in result) {
          const details = result.withdraw_details
            .map((d) => `  - ${d.token}: ${formatUsd(d.value_in_usd)}`)
            .join('\n');

          return textResponse(
            [
              `Partial withdrawal processed for ${formatAddress(smart_account_address)}.`,
              '',
              `Total: ${formatUsd(result.total_value_in_usd)}`,
              `Date: ${formatDate(result.date)}`,
              '',
              'Details:',
              details,
              '',
              'Your agent remains active with the remaining funds.',
            ].join('\n'),
          );
        }

        return textResponse(
          [
            `Full withdrawal initiated for ${formatAddress(smart_account_address)}.`,
            '',
            result.message,
            '',
            'Use get_withdrawal_status to track progress.',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'get_withdrawal_status',
    'Check the status of a pending withdrawal',
    { smart_account_address: addressSchema },
    async ({ smart_account_address }) => {
      try {
        const status = await sdk.agent.getWithdrawalStatus(
          smart_account_address as Address,
        );

        const lines: string[] = [
          `Withdrawal status for ${formatAddress(smart_account_address)}:`,
          '',
          `Status: ${formatStatus(status.status)}`,
          `Activated: ${formatDate(status.activation_date)}`,
        ];

        if (status.last_deactivation_date) {
          lines.push(
            `Last deactivation: ${formatDate(status.last_deactivation_date)}`,
          );
        }

        if (status.last_reactivation_date) {
          lines.push(
            `Last reactivation: ${formatDate(status.last_reactivation_date)}`,
          );
        }

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'get_transactions',
    'View transaction history for your smart account',
    {
      smart_account_address: addressSchema,
      page: z.number().int().positive().optional().describe('Page number'),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe('Items per page (max 100)'),
      sort: z
        .enum(['date_asc', 'date_desc'])
        .optional()
        .describe('Sort order'),
    },
    async ({ smart_account_address, page, limit, sort }) => {
      try {
        const { transactions, pagination } =
          await sdk.agent.getTransactions({
            wallet: smart_account_address as Address,
            page,
            limit,
            sort: sort === 'date_asc'
              ? SortOrder.DATE_ASC
              : sort === 'date_desc'
                ? SortOrder.DATE_DESC
                : undefined,
          });

        if (transactions.length === 0) {
          return textResponse('No transactions found for this account.');
        }

        const lines: string[] = [
          `Transactions for ${formatAddress(smart_account_address)}`,
          `(Page ${pagination.current_page} of ${pagination.total_pages}, ${pagination.total_items} total)`,
          '',
        ];

        for (const tx of transactions) {
          const date = formatDate(tx.date);
          const status = formatStatus(tx.status);
          const protocol = tx.protocol ? ` on ${tx.protocol}` : '';
          lines.push(
            `  ${date} | ${tx.action} | ${tx.amount} ${tx.token_type}${protocol} | ${status}`,
          );
        }

        if (pagination.current_page < pagination.total_pages) {
          lines.push(
            '',
            `Use page: ${pagination.current_page + 1} to see more.`,
          );
        }

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'get_deposits',
    'View deposit history for your smart account',
    { smart_account_address: addressSchema },
    async ({ smart_account_address }) => {
      try {
        const { deposits } = await sdk.agent.getDeposits(
          smart_account_address as Address,
        );

        if (deposits.length === 0) {
          return textResponse('No deposits found for this account.');
        }

        const lines: string[] = [
          `Deposits for ${formatAddress(smart_account_address)}:`,
          '',
        ];

        for (const dep of deposits) {
          const date = dep.date ? formatDate(dep.date) : 'unknown date';
          lines.push(`  - ${dep.amount} ${dep.token_type} on ${date}`);
        }

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
