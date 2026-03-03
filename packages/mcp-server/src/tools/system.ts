import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema } from '../schemas.js';
import {
  getDefaultGizaClient,
  getGizaClient,
} from '../services/sdk-factory.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';

export function registerSystemTools(server: McpServer): void {
  server.registerTool(
    'giza_health',
    {
      title: 'Giza Health Check',
      description: 'Check if the Giza API is healthy and operational.',
      inputSchema: z.object({}),
    },
    async () => {
      return handleToolCall(
        () => getDefaultGizaClient().health(),
        (result) => jsonResult(result),
      );
    },
  );

  server.registerTool(
    'giza_get_config',
    {
      title: 'Giza API Config',
      description:
        'Get the current Giza API configuration and supported features.',
      inputSchema: z.object({}),
    },
    async () => {
      return handleToolCall(
        () => getDefaultGizaClient().getApiConfig(),
        (result) => jsonResult(result),
      );
    },
  );

  server.registerTool(
    'giza_get_stats',
    {
      title: 'Giza Chain Statistics',
      description:
        'Get statistics for a specific blockchain network, including TVL, active agents, and protocol distribution.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }) => {
      return handleToolCall(
        () => getGizaClient(chain).stats(),
        (result) => jsonResult(result),
      );
    },
  );

  server.registerTool(
    'giza_get_tvl',
    {
      title: 'Giza TVL',
      description:
        'Get the total value locked (TVL) on a specific blockchain network.',
      inputSchema: z.object({ chain: chainSchema }),
    },
    async ({ chain }) => {
      return handleToolCall(
        () => getGizaClient(chain).tvl(),
        (result) => jsonResult(result),
      );
    },
  );
}
