import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth.js';
import { chainSchema, paginationSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import {
  createPendingOperation,
  confirmationPayload,
} from '../services/confirmation.js';
import { getAgentForSession } from '../services/sdk-factory.js';
import { getBaseUrl } from '../constants.js';

export function registerRewardTools(server: McpServer): void {
  server.registerTool(
    'giza_list_rewards',
    {
      title: 'List Rewards',
      description:
        'List paginated rewards earned by the agent, including APR breakdown and token amounts.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.rewards({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_list_reward_history',
    {
      title: 'List Reward History',
      description:
        'List paginated historical reward data for the agent.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
    },
    async ({ chain, page, limit, sort }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.rewardHistory({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_claim_rewards',
    {
      title: 'Claim Rewards',
      description:
        'Claim all pending rewards for the agent. Returns a confirmation token that must be passed to giza_confirm_operation to execute.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          const description = `Claim all pending rewards on ${chain}`;
          const token = createPendingOperation(
            'claim_rewards',
            description,
            ctx.walletAddress,
            () => agent.claimRewards(),
          );
          return confirmationPayload('claim_rewards', description, token);
        },
        jsonResult,
      ),
  );
}
