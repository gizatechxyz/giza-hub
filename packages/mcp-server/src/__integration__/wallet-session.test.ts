import { createTestHarness } from './helpers/mcp-client.js';

const WALLET_A = '0x1111111111111111111111111111111111111111';
const WALLET_B = '0x2222222222222222222222222222222222222222';

function getText(result: { content: unknown }): string {
  return (result.content as Array<{ type: string; text: string }>)[0]!.text;
}

describe('wallet session', () => {
  it('connect then get_portfolio succeeds', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: WALLET_A },
      });
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(getText(result));
      expect(parsed).toHaveProperty('wallet');
    } finally {
      await cleanup();
    }
  });

  it('connect then disconnect then get_portfolio fails', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: WALLET_A },
      });
      await client.callTool({
        name: 'disconnect_wallet',
        arguments: {},
      });
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('connect_wallet');
    } finally {
      await cleanup();
    }
  });

  it('second connect_wallet overwrites previous wallet', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: WALLET_A },
      });
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: WALLET_B },
      });
      await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(mockGiza.agent).toHaveBeenLastCalledWith(WALLET_B);
    } finally {
      await cleanup();
    }
  });

  it('wallet state persists across multiple sequential calls', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: WALLET_A },
      });

      const r1 = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(r1.isError).toBeFalsy();

      const r2 = await client.callTool({
        name: 'get_deposits',
        arguments: {},
      });
      expect(r2.isError).toBeFalsy();

      const r3 = await client.callTool({
        name: 'get_fees',
        arguments: {},
      });
      expect(r3.isError).toBeFalsy();
    } finally {
      await cleanup();
    }
  });
});
