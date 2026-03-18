import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema, paginationSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_READONLY } from '../constants';

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
          const ctx = ensureAuth(extra);
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
          const ctx = ensureAuth(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.rewardHistory({ sort }).page(page ?? 1, { limit });
        },
        jsonResult,
      ),
  );
}
