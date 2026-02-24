import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GizaServer } from '../server.js';
import { allTools } from '../tools/index.js';
import { DEFAULT_SYSTEM_PROMPT } from '../prompt.js';
import { createMockGiza } from './helpers/mock-giza.js';
import { createTestHarness } from './helpers/mcp-client.js';
import type { Giza } from '@gizatech/agent-sdk';

describe('server lifecycle', () => {
  it('constructs without throwing', () => {
    const mockGiza = createMockGiza();
    expect(
      () =>
        new GizaServer({
          giza: mockGiza as unknown as Giza,
          tools: allTools,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          name: 'test',
          version: '0.0.1',
          transport: 'stdio',
          port: 3000,
        }),
    ).not.toThrow();
  });

  it('exposes mcp as an McpServer instance', () => {
    const mockGiza = createMockGiza();
    const server = new GizaServer({
      giza: mockGiza as unknown as Giza,
      tools: allTools,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      name: 'test',
      version: '0.0.1',
      transport: 'stdio',
      port: 3000,
    });
    expect(server.mcp).toBeInstanceOf(McpServer);
  });

  it('tools are accessible via client after connection', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      const result = await client.listTools();
      expect(result.tools.length).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });
});
