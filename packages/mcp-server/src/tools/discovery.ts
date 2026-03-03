import { CHAIN_NAMES, Chain } from '@gizatech/agent-sdk';
import type { Address } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema, addressSchema } from '../schemas.js';
import {
  getDefaultGizaClient,
  getGizaClient,
} from '../services/sdk-factory.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';

export function registerDiscoveryTools(server: McpServer): void {
  server.registerTool(
    'giza_list_chains',
    {
      title: 'List Chains',
      description:
        'List all blockchain networks supported by Giza, with their chain IDs and names.',
      inputSchema: z.object({}),
    },
    async () => {
      return handleToolCall(
        () => getDefaultGizaClient().chains(),
        (result) => {
          const enriched = result.chain_ids.map((chainId: number) => ({
            chainId,
            name: CHAIN_NAMES[chainId as Chain] ?? `Chain ${chainId}`,
          }));
          return jsonResult(enriched);
        },
      );
    },
  );

  server.registerTool(
    'giza_list_tokens',
    {
      title: 'List Tokens',
      description:
        'List all tokens available for yield optimization on a specific blockchain network.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }) => {
      return handleToolCall(
        () => getGizaClient(chain).tokens(),
        (result) => jsonResult(result),
      );
    },
  );

  server.registerTool(
    'giza_list_protocols',
    {
      title: 'List Protocols',
      description:
        'List all DeFi protocols available for a specific token on a blockchain network.',
      inputSchema: z.object({
        chain: chainSchema,
        token: addressSchema.describe('Token contract address'),
      }),
    },
    async ({ chain, token }) => {
      return handleToolCall(
        () => getGizaClient(chain).protocols(token as Address),
        (result) => jsonResult(result),
      );
    },
  );

  server.registerTool(
    'giza_get_protocol_supply',
    {
      title: 'Protocol Supply',
      description:
        'Get supply data for all protocols supporting a specific token on a blockchain network.',
      inputSchema: z.object({
        chain: chainSchema,
        token: addressSchema.describe('Token contract address'),
      }),
    },
    async ({ chain, token }) => {
      return handleToolCall(
        () => getGizaClient(chain).protocolSupply(token as Address),
        (result) => jsonResult(result),
      );
    },
  );
}
