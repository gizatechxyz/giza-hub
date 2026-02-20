import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProtocolTools } from './protocol.tools.js';

function createMockSdk() {
  return {
    agent: {
      getProtocols: vi.fn(),
    },
  };
}

function captureTools(server: McpServer) {
  const tools = new Map<string, Function>();
  const originalTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    const name = args[0] as string;
    const handler = args[args.length - 1] as Function;
    tools.set(name, handler);
    return originalTool(...(args as Parameters<typeof originalTool>));
  }) as typeof server.tool;
  return tools;
}

describe('protocol tools', () => {
  let server: McpServer;
  let sdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' });
    sdk = createMockSdk();
  });

  it('get_protocols lists available protocols', async () => {
    sdk.agent.getProtocols.mockResolvedValue({
      protocols: ['aave', 'compound', 'moonwell'],
    });

    const tools = captureTools(server);
    registerProtocolTools(server, sdk as never);

    const handler = tools.get('get_protocols')!;
    const result = await handler({
      token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    });

    expect(result.content[0].text).toContain('3 protocols');
    expect(result.content[0].text).toContain('aave');
    expect(result.content[0].text).toContain('compound');
    expect(result.content[0].text).toContain('moonwell');
  });

  it('get_protocols handles empty result', async () => {
    sdk.agent.getProtocols.mockResolvedValue({ protocols: [] });

    const tools = captureTools(server);
    registerProtocolTools(server, sdk as never);

    const handler = tools.get('get_protocols')!;
    const result = await handler({
      token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    });

    expect(result.content[0].text).toContain('No protocols');
  });
});
