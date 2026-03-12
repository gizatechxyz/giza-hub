import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getGizaClient } from '../services/sdk-factory';
import { ANNOTATIONS_MUTATING, ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

export function registerAgentManagementTools(server: McpServer): void {
  server.registerTool(
    'giza_create_agent',
    {
      title: 'Create Agent',
      description:
        'Create a smart account on a chain. Call giza_get_agent first to check if one exists.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_MUTATING,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const giza = getGizaClient(chain);
          return giza.createAgent(ctx.walletAddress);
        },
        (agent) => jsonResult({ wallet: agent.wallet }),
      ),
  );

  server.registerTool(
    'giza_get_agent',
    {
      title: 'Get Agent',
      description:
        'Look up the user\'s existing agent on a chain. Call before giza_create_agent to avoid duplicates.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const giza = getGizaClient(chain);
          return giza.getAgent(ctx.walletAddress);
        },
        (agent) => jsonResult({ wallet: agent.wallet }),
      ),
  );

  server.registerTool(
    'giza_get_smart_account',
    {
      title: 'Get Smart Account',
      description:
        'Get smart account details (addresses, chain). Use when the user asks about their account address.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const giza = getGizaClient(chain);
          return giza.getSmartAccount(ctx.walletAddress);
        },
        jsonResult,
      ),
  );
}
