import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema } from '../schemas.js';
import {
  getDefaultGizaClient,
  getGizaClient,
} from '../services/sdk-factory.js';
import { ANNOTATIONS_READONLY } from '../constants.js';
import { handleToolCall, jsonResult } from '../services/error-handler.js';

export function registerSystemTools(server: McpServer): void {
  server.registerTool(
    'giza_health',
    {
      title: 'Giza Health Check',
      description:
        'Check if the Giza API is reachable. Use only as a diagnostic when other calls fail.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_READONLY,
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
        'Get API configuration and feature flags. Rarely needed — prefer giza_list_chains or giza_list_tokens.',
      inputSchema: z.object({}),
      annotations: ANNOTATIONS_READONLY,
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
        'Get chain-level stats: TVL, active agents, protocol breakdown. Use for market overview questions.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
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
        'Get total value locked on a chain. Use giza_get_stats instead if the user also wants agent counts.',
      inputSchema: z.object({ chain: chainSchema }),
      annotations: ANNOTATIONS_READONLY,
    },
    async ({ chain }) => {
      return handleToolCall(
        () => getGizaClient(chain).tvl(),
        (result) => jsonResult(result),
      );
    },
  );
}
