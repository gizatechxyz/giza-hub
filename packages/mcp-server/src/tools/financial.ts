import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import {
  createPendingOperation,
  confirmationPayload,
} from '../services/confirmation';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_DESTRUCTIVE, ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

export function registerFinancialTools(server: McpServer): void {
  server.registerTool(
    'giza_withdraw',
    {
      title: 'Withdraw Funds',
      description:
        'Withdraw funds from the agent back to the user\'s wallet. Omit amount for full withdrawal. DESTRUCTIVE: returns a confirmationToken — ask the user to confirm, then call giza_confirm_operation.',
      inputSchema: z.object({
        chain: chainSchema,
        amount: z
          .string()
          .optional()
          .describe(
            'Amount to withdraw as a string. Omit for full withdrawal.',
          ),
      }),
      annotations: ANNOTATIONS_DESTRUCTIVE,
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
        'Check status of a pending withdrawal or deactivation. Use after giza_withdraw or giza_deactivate_agent.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
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
        'Get the fee structure (10% performance fee on yield only, no fees on deposits/withdrawals). Use when the user asks about costs.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
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
        'Get the maximum deposit allowed for this wallet on a chain. Use before large deposits.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
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
