import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth, ensureAuthWithToken } from '../auth/ensure-auth';
import { chainSchema, paginationSchema, chainDisplayName } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import {
  createPendingOperation,
  confirmationPayload,
} from '../services/confirmation';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_DESTRUCTIVE, ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

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
        'Claim your pending rewards and send them to your wallet. Requires user confirmation before proceeding.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_DESTRUCTIVE,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuthWithToken(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress, ctx.privyIdToken);
          const description = `Claim all your pending rewards on ${chainDisplayName(chain)} and send them to your wallet`;
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
