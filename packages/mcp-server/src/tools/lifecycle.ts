import type { Address } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { ensureAuth } from '../auth/ensure-auth';
import { chainSchema, addressSchema, constraintSchema, chainDisplayName } from '../schemas';
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
        'Start earning yield by activating your account with a deposit and choosing DeFi protocols. The user must first send tokens to the account address.',
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
        'Stop your Giza agent and return remaining funds to your wallet. Requires user confirmation before proceeding.',
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
            ? `Stop your Giza agent on ${chainDisplayName(chain)} and return all remaining funds to your wallet`
            : `Stop your Giza agent on ${chainDisplayName(chain)} without transferring funds`;
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
        'Add more funds to your active Giza account. The user must send tokens to the account address and provide the transaction hash.',
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
