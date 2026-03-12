import { CHAIN_NAMES, Chain } from '@gizatech/agent-sdk';
import type { Address } from '@gizatech/agent-sdk';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema, addressSchema } from '../schemas';
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
        'List supported chains with IDs and names. Call first if the user hasn\'t specified a chain.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_READONLY,
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
        'List tokens available for yield optimization on a chain. Call before giza_activate_agent.',
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
        'List DeFi protocols for a token on a chain. Needed before giza_activate_agent to pick protocols.',
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
        'Get supply deposited into each protocol for a token. Use for comparing protocol sizes.',
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
