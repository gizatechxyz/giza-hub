import type { Address } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema, addressSchema, chainDisplayName } from '../schemas';
import {
  getDefaultGizaClient,
  getGizaClient,
} from '../services/sdk-factory';
import { ANNOTATIONS_READONLY } from '../constants';
import { handleToolCall, jsonResult } from '../services/error-handler';

export function registerDiscoveryTools(server: McpServer): void {
  server.registerTool(
    'giza_list_chains',
    {
      title: 'List Chains',
      description:
        'List supported networks. Use when the user hasn\'t specified which network to use.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_READONLY,
    },
    async () => {
      return handleToolCall(
        () => getDefaultGizaClient().chains(),
        (result) => {
          const enriched = result.chain_ids.map((chainId: number) => ({
            chainId,
            name: chainDisplayName(chainId),
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
        'List tokens available for yield optimization on a network.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
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
        'List DeFi protocols available for a token on a network.',
      inputSchema: z.object({
        chain: chainSchema,
        token: addressSchema.describe('Token contract address'),
      }),
      annotations: ANNOTATIONS_READONLY,
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
        'See how much is deposited into each protocol for a token. Useful for comparing protocol sizes.',
      inputSchema: z.object({
        chain: chainSchema,
        token: addressSchema.describe('Token contract address'),
      }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain, token }) => {
      return handleToolCall(
        () => getGizaClient(chain).protocolSupply(token as Address),
        (result) => jsonResult(result),
      );
    },
  );
}
