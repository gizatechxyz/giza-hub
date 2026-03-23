import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { chainSchema } from '../schemas';
import {
  getDefaultGizaClient,
  getGizaClient,
} from '../services/sdk-factory';
import { ANNOTATIONS_READONLY } from '../constants';
import { handleToolCall, jsonResult } from '../services/error-handler';

export function registerSystemTools(server: McpServer): void {
  server.registerTool(
    'giza_health',
    {
      title: 'Giza Health Check',
      description:
        'Check if Giza is online. Use as a diagnostic when other operations fail.',
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
        'Get Giza configuration and feature flags. Rarely needed.',
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
        'Get network statistics: total value deposited, active accounts, and protocol breakdown.',
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

}
