import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { jsonResult } from '../format.js';

const withdraw: ToolDefinition = {
  name: 'withdraw',
  description:
    'Withdraw funds from the yield agent. ' +
    'If amount is provided, performs a partial withdrawal. ' +
    'If omitted, performs a full withdrawal (deactivation with transfer). ' +
    'Requires a connected wallet.',
  inputSchema: z.object({
    amount: z.string().optional(),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.withdraw(
      input['amount'] as string | undefined,
    );
    return jsonResult(result);
  },
};

const getWithdrawalStatus: ToolDefinition = {
  name: 'get_withdrawal_status',
  description:
    'Get the current withdrawal/deactivation status for the connected wallet.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.status();
    return jsonResult(result);
  },
};

const getTransactions: ToolDefinition = {
  name: 'get_transactions',
  description:
    'Get the transaction history for the connected wallet. ' +
    'Returns the first page of transactions.',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(100).optional().default(20),
    sort: z.string().optional(),
  }),
  async handler(ctx, input) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const paginator = agent.transactions({
      limit: input['limit'] as number | undefined,
      sort: input['sort'] as string | undefined,
    });
    const items = await paginator.first(input['limit'] as number ?? 20);
    return jsonResult(items);
  },
};

const getFees: ToolDefinition = {
  name: 'get_fees',
  description:
    'Get the fee information (percentage and absolute) for the connected wallet.',
  inputSchema: z.object({}),
  async handler(ctx) {
    const wallet = ctx.walletStore.require(ctx.sessionId);
    const agent = ctx.giza.agent(wallet);
    const result = await agent.fees();
    return jsonResult(result);
  },
};

export const financialTools: ToolDefinition[] = [
  withdraw,
  getWithdrawalStatus,
  getTransactions,
  getFees,
];
