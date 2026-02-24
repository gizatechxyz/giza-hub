import { createTestHarness } from './helpers/mcp-client.js';

const VALID_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const VALID_TOKEN = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('tool execution', () => {
  let client: Awaited<ReturnType<typeof createTestHarness>>['client'];
  let mockGiza: Awaited<ReturnType<typeof createTestHarness>>['mockGiza'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const harness = await createTestHarness();
    client = harness.client;
    mockGiza = harness.mockGiza;
    cleanup = harness.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('connect_wallet with valid address returns success', async () => {
    const result = await client.callTool({
      name: 'connect_wallet',
      arguments: { wallet: VALID_WALLET },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]!
      .text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain('connected');
  });

  it('get_tokens calls giza.tokens() and returns JSON', async () => {
    const result = await client.callTool({
      name: 'get_tokens',
      arguments: {},
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]!
      .text;
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(mockGiza.tokens).toHaveBeenCalled();
  });

  it('get_portfolio without wallet returns isError with wallet error message', async () => {
    const freshHarness = await createTestHarness();
    try {
      const result = await freshHarness.client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      const text = (
        result.content as Array<{ type: string; text: string }>
      )[0]!.text;
      expect(text).toContain('connect_wallet');
    } finally {
      await freshHarness.cleanup();
    }
  });

  it('get_portfolio after connect_wallet returns JSON from mock', async () => {
    const result = await client.callTool({
      name: 'get_portfolio',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]!
      .text;
    const parsed = JSON.parse(text);
    expect(parsed).toHaveProperty('wallet');
    expect(parsed).toHaveProperty('status');
  });

  it('optimize calls giza.optimize() with forwarded params', async () => {
    const params = {
      token: VALID_TOKEN,
      capital: '1000000',
      currentAllocations: { Aave: '500000' },
      protocols: ['Aave', 'Compound'],
    };
    const result = await client.callTool({
      name: 'optimize',
      arguments: params,
    });
    expect(result.isError).toBeFalsy();
    expect(mockGiza.optimize).toHaveBeenCalled();
  });
});
