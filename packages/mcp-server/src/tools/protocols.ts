import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { requireAuth } from '../auth/types.js';
import { chainSchema, constraintSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { getAgentForSession } from '../services/sdk-factory.js';

export function registerProtocolTools(server: McpServer): void {
  server.registerTool(
    'giza_get_agent_protocols',
    {
      title: 'Get Agent Protocols',
      description:
        'Get the list of DeFi protocols currently configured for the agent.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.protocols();
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_update_protocols',
    {
      title: 'Update Agent Protocols',
      description:
        'Update the list of DeFi protocols the agent is allowed to allocate to.',
      inputSchema: z.object({
        chain: chainSchema,
        protocols: z
          .array(z.string())
          .min(1)
          .describe('Protocol names to set for the agent'),
      }),
    },
    async ({ chain, protocols }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          await agent.updateProtocols(protocols);
          return { updated: true, protocols };
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_get_constraints',
    {
      title: 'Get Agent Constraints',
      description:
        'Get the current allocation constraints configured for the agent.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.constraints();
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_update_constraints',
    {
      title: 'Update Agent Constraints',
      description:
        'Update the allocation constraints for the agent (e.g. min protocols, max allocation per protocol).',
      inputSchema: z.object({
        chain: chainSchema,
        constraints: z
          .array(constraintSchema)
          .min(1)
          .describe('Constraint configurations to apply'),
      }),
    },
    async ({ chain, constraints }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          await agent.updateConstraints(constraints);
          return { updated: true, constraints };
        },
        jsonResult,
      ),
  );
}
