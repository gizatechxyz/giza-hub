import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPortfolioTools } from './portfolio.tools.js';
import type { Address } from '@gizatech/agent-sdk';

function createMockSdk() {
  return {
    agent: {
      getPortfolio: vi.fn(),
      getPerformance: vi.fn(),
      getAPR: vi.fn(),
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

const SMART_ACCOUNT: Address = '0x1234567890abcdef1234567890abcdef12345678';

describe('portfolio tools', () => {
  let server: McpServer;
  let sdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' });
    sdk = createMockSdk();
  });

  it('get_portfolio returns portfolio info', async () => {
    sdk.agent.getPortfolio.mockResolvedValue({
      wallet: SMART_ACCOUNT,
      status: 'active',
      activation_date: '2025-01-15T00:00:00Z',
      selected_protocols: ['aave', 'compound'],
      deposits: [{ amount: 1000, token_type: 'USDC', date: '2025-01-15T00:00:00Z' }],
      withdraws: [],
    });

    const tools = captureTools(server);
    registerPortfolioTools(server, sdk as never);

    const handler = tools.get('get_portfolio')!;
    const result = await handler({ smart_account_address: SMART_ACCOUNT });

    expect(result.content[0].text).toContain('Active');
    expect(result.content[0].text).toContain('aave, compound');
    expect(result.content[0].text).toContain('USDC');
  });

  it('get_performance returns chart data', async () => {
    sdk.agent.getPerformance.mockResolvedValue({
      performance: [
        { date: '2025-01-15', value: 1000, value_in_usd: 1000 },
        { date: '2025-02-15', value: 1050, value_in_usd: 1050 },
      ],
    });

    const tools = captureTools(server);
    registerPortfolioTools(server, sdk as never);

    const handler = tools.get('get_performance')!;
    const result = await handler({ smart_account_address: SMART_ACCOUNT });

    expect(result.content[0].text).toContain('Performance');
    expect(result.content[0].text).toContain('$1,050.00');
  });

  it('get_performance handles empty data', async () => {
    sdk.agent.getPerformance.mockResolvedValue({ performance: [] });

    const tools = captureTools(server);
    registerPortfolioTools(server, sdk as never);

    const handler = tools.get('get_performance')!;
    const result = await handler({ smart_account_address: SMART_ACCOUNT });

    expect(result.content[0].text).toContain('No performance data');
  });

  it('get_apr returns APR data', async () => {
    sdk.agent.getAPR.mockResolvedValue({ apr: 0.0523 });

    const tools = captureTools(server);
    registerPortfolioTools(server, sdk as never);

    const handler = tools.get('get_apr')!;
    const result = await handler({ smart_account_address: SMART_ACCOUNT });

    expect(result.content[0].text).toContain('5.23%');
  });
});
