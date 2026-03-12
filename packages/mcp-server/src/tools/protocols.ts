import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema, constraintSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_IDEMPOTENT_MUTATING, ANNOTATIONS_READONLY, getBaseUrl } from '../constants';

export function registerProtocolTools(server: McpServer): void {
  server.registerTool(
    'giza_get_agent_protocols',
    {
      title: 'Get Agent Protocols',
      description:
        'Get protocols currently assigned to the agent.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Change which protocols the agent allocates to.',
      inputSchema: z.object({
        chain: chainSchema,
        protocols: z
          .array(z.string())
          .min(1)
          .describe('Protocol names to set for the agent'),
      }),
      annotations: ANNOTATIONS_IDEMPOTENT_MUTATING,
    },
    async ({ chain, protocols }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Get the agent\'s allocation constraints (min protocols, max per protocol, etc.).',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Update allocation constraints. Use when the user wants to limit exposure or set diversification rules.',
      inputSchema: z.object({
        chain: chainSchema,
        constraints: z
          .array(constraintSchema)
          .min(1)
          .describe('Constraint configurations to apply'),
      }),
      annotations: ANNOTATIONS_IDEMPOTENT_MUTATING,
    },
    async ({ chain, constraints }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          await agent.updateConstraints(constraints);
          return { updated: true, constraints };
        },
        jsonResult,
      ),
  );
}
