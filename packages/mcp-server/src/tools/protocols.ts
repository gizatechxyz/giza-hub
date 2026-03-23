import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuthWithToken } from '../auth/ensure-auth';
import { chainSchema, constraintSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_IDEMPOTENT_MUTATING, ANNOTATIONS_READONLY } from '../constants';

export function registerProtocolTools(server: McpServer): void {
  server.registerTool(
    'giza_get_agent_protocols',
    {
      title: 'Get Agent Protocols',
      description:
        'See which DeFi protocols your account is currently using.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuthWithToken(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress, ctx.privyIdToken);
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
        'Change which DeFi protocols your account uses for yield optimization.',
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
          const ctx = await ensureAuthWithToken(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress, ctx.privyIdToken);
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
        'See your allocation rules (minimum protocols, maximum per protocol, etc.).',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuthWithToken(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress, ctx.privyIdToken);
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
        'Update your allocation rules to limit exposure or set diversification preferences.',
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
          const ctx = await ensureAuthWithToken(extra);
          const agent = await getAgentForSession(chain, ctx.walletAddress, ctx.privyIdToken);
          await agent.updateConstraints(constraints);
          return { updated: true, constraints };
        },
        jsonResult,
      ),
  );
}
