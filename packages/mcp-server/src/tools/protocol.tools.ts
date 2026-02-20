import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GizaAgent, Address } from '@gizatech/agent-sdk';
import { formatToolError } from '../errors.js';
import { textResponse } from '../format.js';

export function registerProtocolTools(
  server: McpServer,
  sdk: GizaAgent,
): void {
  server.tool(
    'get_protocols',
    'Get available yield protocols for a token',
    { token_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address') },
    async ({ token_address }) => {
      try {
        const { protocols } = await sdk.agent.getProtocols(
          token_address as Address,
        );

        if (protocols.length === 0) {
          return textResponse(
            'No protocols are currently available for this token.',
          );
        }

        const list = protocols.map((p) => `  - ${p}`).join('\n');
        return textResponse(
          [
            `${protocols.length} protocol${protocols.length === 1 ? '' : 's'} available:`,
            '',
            list,
            '',
            'You can select any of these protocols when activating your agent.',
          ].join('\n'),
        );
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
