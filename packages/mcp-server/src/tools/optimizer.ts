import { Chain, WalletConstraints } from '@gizatech/agent-sdk';
import type { Address, OptimizerConstraintConfig } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema, addressSchema } from '../schemas';
import { ANNOTATIONS_READONLY } from '../constants';
import { handleToolCall, jsonResult } from '../services/error-handler';
import { getGizaClient } from '../services/sdk-factory';

export function registerOptimizerTools(server: McpServer): void {
  server.registerTool(
    'giza_optimize',
    {
      title: 'Optimize Allocation',
      description:
        'Simulate optimal capital allocation across DeFi protocols for a token and amount. No auth needed. Use for "where should I put my money" questions before committing funds.',
      inputSchema: z.object({
        chain: chainSchema.optional(),
        token: addressSchema.describe('Token contract address to optimize'),
        capital: z
          .string()
          .describe('Total capital amount as an integer string (e.g. "1000000")'),
        currentAllocations: z
          .record(z.string(), z.string())
          .describe(
            'Current protocol allocations as protocol name → amount string',
          ),
        protocols: z
          .array(z.string())
          .min(1)
          .describe('Protocol names to consider for allocation'),
        constraints: z
          .array(
            z.object({
              kind: z
                .nativeEnum(WalletConstraints)
                .describe('Constraint type'),
              params: z
                .record(z.string(), z.unknown())
                .describe('Constraint parameters'),
            }),
          )
          .optional()
          .describe('Optional optimizer constraints'),
        wallet: addressSchema
          .optional()
          .describe('Optional wallet address for context'),
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({
      chain,
      token,
      capital,
      currentAllocations,
      protocols,
      constraints,
      wallet,
    }) =>
      handleToolCall(
        async () => {
          const giza = getGizaClient(chain ?? Chain.BASE);
          return giza.optimize({
            chain,
            token: token as Address,
            capital,
            currentAllocations,
            protocols,
            constraints: constraints as OptimizerConstraintConfig[] | undefined,
            wallet: wallet as Address | undefined,
          });
        },
        jsonResult,
      ),
  );
}
