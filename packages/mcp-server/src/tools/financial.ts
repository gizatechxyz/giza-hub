import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth.js';
import { chainSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import {
  createPendingOperation,
  confirmationPayload,
} from '../services/confirmation.js';
import { getAgentForSession } from '../services/sdk-factory.js';
import { getBaseUrl } from '../constants.js';

export function registerFinancialTools(server: McpServer): void {
  server.registerTool(
    'giza_withdraw',
    {
      title: 'Withdraw Funds',
      description:
        'Withdraw funds from the agent. If no amount is specified, performs a full withdrawal. Provide an amount string for partial withdrawal. Returns a confirmation token that must be passed to giza_confirm_operation to execute.',
      inputSchema: z.object({
        chain: chainSchema,
        amount: z
          .string()
          .optional()
          .describe(
            'Amount to withdraw as a string. Omit for full withdrawal.',
          ),
      }),
    },
    async ({ chain, amount }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          const description = amount
            ? `Withdraw ${amount} from agent on ${chain}`
            : `Full withdrawal from agent on ${chain}`;
          const token = createPendingOperation(
            'withdraw',
            description,
            ctx.walletAddress,
            () => agent.withdraw(amount),
          );
          return confirmationPayload('withdraw', description, token);
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_withdrawal_status',
    {
      title: 'Get Withdrawal Status',
      description:
        'Get the current withdrawal/deactivation status of the agent.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.status();
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_fees',
    {
      title: 'Get Fees',
      description:
        'Get the current fee structure for the agent, including percentage and absolute fee amounts.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.fees();
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_limit',
    {
      title: 'Get Deposit Limit',
      description:
        'Get the deposit limit for the authenticated wallet on the specified chain.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.limit(ctx.walletAddress);
        },
        jsonResult,
      ),
  );
}
