import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent, Address } from '@gizatech/agent-sdk';
import { formatToolError } from '../errors.js';
import {
  formatAddress,
  formatDate,
  formatUsd,
  formatPercent,
  formatStatus,
  textResponse,
} from '../format.js';

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

export function registerPortfolioTools(
  server: McpServer,
  sdk: GizaAgent,
): void {
  server.tool(
    'get_portfolio',
    'View your current portfolio and agent status',
    { smart_account_address: addressSchema },
    async ({ smart_account_address }) => {
      try {
        const info = await sdk.agent.getPortfolio({
          wallet: smart_account_address as Address,
        });

        const lines: string[] = [
          `Portfolio for ${formatAddress(smart_account_address)}`,
          '',
          `Status: ${formatStatus(info.status)}`,
          `Active since: ${formatDate(info.activation_date)}`,
        ];

        if (info.selected_protocols.length > 0) {
          lines.push(`Protocols: ${info.selected_protocols.join(', ')}`);
        }

        if (info.deposits.length > 0) {
          lines.push('', 'Deposits:');
          for (const dep of info.deposits) {
            const date = dep.date ? ` on ${formatDate(dep.date)}` : '';
            lines.push(`  - ${dep.amount} ${dep.token_type}${date}`);
          }
        }

        if (info.withdraws && info.withdraws.length > 0) {
          lines.push('', 'Withdrawals:');
          for (const w of info.withdraws) {
            lines.push(
              `  - ${formatUsd(w.total_value_in_usd)} on ${formatDate(w.date)}`,
            );
          }
        }

        lines.push(
          '',
          'Use get_performance for yield charts or get_apr for return rates.',
        );

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'get_performance',
    'View performance history and yield data over time',
    {
      smart_account_address: addressSchema,
      from_date: z
        .string()
        .optional()
        .describe('Start date (ISO format, e.g. 2025-01-01)'),
    },
    async ({ smart_account_address, from_date }) => {
      try {
        const { performance } = await sdk.agent.getPerformance({
          wallet: smart_account_address as Address,
          from_date,
        });

        if (performance.length === 0) {
          return textResponse(
            'No performance data available yet. Check back after the agent has been active for a while.',
          );
        }

        const latest = performance[performance.length - 1]!;
        const earliest = performance[0]!;

        const lines: string[] = [
          `Performance for ${formatAddress(smart_account_address)}`,
          '',
          `Period: ${formatDate(earliest.date)} — ${formatDate(latest.date)}`,
          `Data points: ${performance.length}`,
        ];

        if (latest.value_in_usd !== undefined) {
          lines.push(`Current value: ${formatUsd(latest.value_in_usd)}`);
        } else {
          lines.push(`Current value: ${latest.value}`);
        }

        if (latest.portfolio) {
          lines.push('', 'Current allocation:');
          for (const [protocol, alloc] of Object.entries(latest.portfolio)) {
            lines.push(`  - ${protocol}: ${formatUsd(alloc.value_in_usd)}`);
          }
        }

        if (latest.accrued_rewards) {
          const rewardEntries = Object.entries(latest.accrued_rewards);
          if (rewardEntries.length > 0) {
            lines.push('', 'Accrued rewards:');
            for (const [symbol, reward] of rewardEntries) {
              lines.push(
                `  - ${symbol}: ${formatUsd(reward.unlocked_value_usd)} unlocked`,
              );
            }
          }
        }

        lines.push('', 'Use get_apr for annualized return rates.');

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'get_apr',
    'Get the annualized percentage rate for your position',
    {
      smart_account_address: addressSchema,
      start_date: z.string().optional().describe('Start date (ISO format)'),
      end_date: z.string().optional().describe('End date (ISO format)'),
    },
    async ({ smart_account_address, start_date, end_date }) => {
      try {
        const result = await sdk.agent.getAPR({
          wallet: smart_account_address as Address,
          start_date,
          end_date,
        });

        const lines: string[] = [
          `APR for ${formatAddress(smart_account_address)}: ${formatPercent(result.apr)}`,
        ];

        if (result.sub_periods && result.sub_periods.length > 0) {
          lines.push('', 'Period breakdown:');
          for (const period of result.sub_periods) {
            lines.push(
              `  - ${formatDate(period.start_date)} to ${formatDate(period.end_date)}: ${formatPercent(period.return_)}`,
            );
          }
        }

        return textResponse(lines.join('\n'));
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
