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
        'Set up a new Giza account on a network. Checks for existing accounts first.',
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
        'Check if you already have a Giza account on a network.',
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
        'Get your Giza account details including addresses and network info.',
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
