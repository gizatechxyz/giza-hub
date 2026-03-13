import type { Address } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema, addressSchema, constraintSchema } from '../schemas';
import { handleToolCall, jsonResult } from '../services/error-handler';
import {
  createPendingOperation,
  confirmationPayload,
} from '../services/confirmation';
import { getAgentForSession } from '../services/sdk-factory';
import { ANNOTATIONS_DESTRUCTIVE, ANNOTATIONS_MUTATING, getBaseUrl } from '../constants';

export function registerLifecycleTools(server: McpServer): void {
  server.registerTool(
    'giza_activate_agent',
    {
      title: 'Activate Agent',
      description:
        'Activate an agent by providing the deposit tx hash and choosing DeFi protocols. The user must first send tokens (USDC/USDT0) to the smart account address. Prerequisites: giza_create_agent, giza_list_protocols.',
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
      annotations: ANNOTATIONS_MUTATING,
    },
    async ({ chain, token, protocols, txHash, constraints }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Deactivate the agent and optionally return remaining funds to the user\'s wallet. DESTRUCTIVE: returns a confirmationToken — ask the user to confirm, then call giza_confirm_operation.',
      inputSchema: z.object({
        chain: chainSchema,
        transfer: z
          .boolean()
          .optional()
          .describe(
            'Whether to transfer remaining funds back (defaults to true)',
          ),
      }),
      annotations: ANNOTATIONS_DESTRUCTIVE,
    },
    async ({ chain, transfer }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
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
        'Add more funds to an already-active agent. The user must send tokens to the smart account and provide the tx hash.',
      inputSchema: z.object({
        chain: chainSchema,
        txHash: z
          .string()
          .describe('Transaction hash of the top-up deposit'),
      }),
      annotations: ANNOTATIONS_MUTATING,
    },
    async ({ chain, txHash }, extra) =>
      handleToolCall(
        async () => {
          const ctx = await ensureAuth(extra, getBaseUrl());
          const agent = await getAgentForSession(chain, ctx.walletAddress);
          return agent.topUp(txHash);
        },
        jsonResult,
      ),
  );
}
