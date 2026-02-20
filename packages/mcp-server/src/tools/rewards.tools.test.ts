import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRewardsTools } from './rewards.tools.js';
import type { Address } from '@gizatech/agent-sdk';

function createMockSdk() {
  return {
    agent: {
      getFees: vi.fn(),
      claimRewards: vi.fn(),
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

describe('rewards tools', () => {
  let server: McpServer;
  let sdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' });
    sdk = createMockSdk();
  });

  it('get_fees returns fee info', async () => {
    sdk.agent.getFees.mockResolvedValue({
      percentage_fee: 0.1,
      fee: 50,
    });

    const tools = captureTools(server);
    registerRewardsTools(server, sdk as never);

    const handler = tools.get('get_fees')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('10.00%');
    expect(result.content[0].text).toContain('$50.00');
  });

  it('claim_rewards returns claimed rewards', async () => {
    sdk.agent.claimRewards.mockResolvedValue({
      rewards: [
        {
          token: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          amount: 1000000,
          amount_float: 1.0,
          current_price_in_underlying: 0.5,
        },
      ],
    });

    const tools = captureTools(server);
    registerRewardsTools(server, sdk as never);

    const handler = tools.get('claim_rewards')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('Rewards claimed');
  });

  it('claim_rewards handles no rewards', async () => {
    sdk.agent.claimRewards.mockResolvedValue({ rewards: [] });

    const tools = captureTools(server);
    registerRewardsTools(server, sdk as never);

    const handler = tools.get('claim_rewards')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('No rewards available');
  });
});
