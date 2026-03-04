import type { Address } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { requireAuth } from '../auth/types.js';
import { chainSchema, addressSchema, constraintSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import {
  createPendingOperation,
  confirmationPayload,
} from '../services/confirmation.js';
import { getAgentForSession } from '../services/sdk-factory.js';

export function registerLifecycleTools(server: McpServer): void {
  server.registerTool(
    'giza_activate_agent',
    {
      title: 'Activate Agent',
      description:
        'Activate an agent by depositing tokens into the smart account. Requires a token address, protocols to allocate to, and the deposit transaction hash.',
      inputSchema: z.object({
        chain: chainSchema,
        token: addressSchema.describe('Token contract address to deposit'),
        protocols: z
          .array(z.string())
          .min(1)
          .describe('Protocol names to allocate deposits to'),
        txHash: z.string().describe('Transaction hash of the token deposit'),
        constraints: z
          .array(constraintSchema)
          .optional()
          .describe('Optional allocation constraints'),
      }),
    },
    async ({ chain, token, protocols, txHash, constraints }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.activate({
            owner: ctx.walletAddress,
            token: token as Address,
            protocols,
            txHash,
            constraints,
          });
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_deactivate_agent',
    {
      title: 'Deactivate Agent',
      description:
        'Deactivate the agent and optionally transfer remaining funds back to the owner wallet. Returns a confirmation token that must be passed to giza_confirm_operation to execute.',
      inputSchema: z.object({
        chain: chainSchema,
        transfer: z
          .boolean()
          .optional()
          .describe(
            'Whether to transfer remaining funds back (defaults to true)',
          ),
      }),
    },
    async ({ chain, transfer }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          const description = transfer !== false
            ? `Deactivate agent on ${chain} and transfer remaining funds`
            : `Deactivate agent on ${chain} without fund transfer`;
          const token = createPendingOperation(
            'deactivate',
            description,
            ctx.walletAddress,
            () => agent.deactivate({ transfer }),
          );
          return confirmationPayload('deactivate', description, token);
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_top_up',
    {
      title: 'Top Up Agent',
      description:
        'Top up an active agent with additional funds by providing the deposit transaction hash.',
      inputSchema: z.object({
        chain: chainSchema,
        txHash: z
          .string()
          .describe('Transaction hash of the top-up deposit'),
      }),
    },
    async ({ chain, txHash }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.topUp(txHash);
        },
        jsonResult,
      ),
  );

  server.registerTool(
    'giza_run_agent',
    {
      title: 'Run Agent',
      description:
        'Trigger an optimization run for the active agent on the specified chain.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }, extra) =>
      handleToolCall(
        async () => {
          const ctx = requireAuth(extra.authInfo);
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.run();
        },
        jsonResult,
      ),
  );
}
