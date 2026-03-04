import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { requireAuth } from '../auth/types.js';
import { chainSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { getGizaClient } from '../services/sdk-factory.js';

export function registerAgentManagementTools(server: McpServer): void {
  server.registerTool(
    'giza_create_agent',
    {
      title: 'Create Agent',
      description:
        'Create a new ERC-4337 smart account agent for the authenticated wallet on the specified chain.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
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
        'Look up the existing agent (smart account) for the authenticated wallet on the specified chain.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
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
        'Get full smart account details (addresses, chain) for the authenticated wallet.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const giza = getGizaClient(chain);
          return giza.getSmartAccount(ctx.walletAddress);
        },
        jsonResult,
      ),
  );
}
