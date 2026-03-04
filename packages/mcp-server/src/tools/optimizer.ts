import { Chain, WalletConstraints } from '@gizatech/agent-sdk';
import type { Address, OptimizerConstraintConfig } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema, addressSchema } from '../schemas.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';
import { getGizaClient } from '../services/sdk-factory.js';

export function registerOptimizerTools(server: McpServer): void {
  server.registerTool(
    'giza_optimize',
    {
      title: 'Optimize Allocation',
      description:
        'Run the yield optimizer to find the best protocol allocation for a given token and capital amount. This is a public tool that does not require authentication.',
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
