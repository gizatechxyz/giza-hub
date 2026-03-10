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
import { ANNOTATIONS_DESTRUCTIVE, ANNOTATIONS_READONLY, getBaseUrl } from '../constants.js';

export function registerRewardTools(server: McpServer): void {
  server.registerTool(
    'giza_list_rewards',
    {
      title: 'List Rewards',
      description:
        'List rewards earned by the agent. Use for "how much have I earned" questions.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
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
        'List historical reward data over time. Use for reward trend questions.',
      inputSchema: z.object({
        chain: chainSchema,
        ...paginationSchema.shape,
      }),
      annotations: ANNOTATIONS_READONLY,
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
        'Claim pending rewards. DESTRUCTIVE: returns a confirmationToken — ask the user to confirm, then call giza_confirm_operation.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_DESTRUCTIVE,
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
