import { createStdioClient, isE2EAvailable } from './helpers/stdio-client.js';

function getText(result: { content: unknown }): string {
  return (result.content as Array<{ type: string; text: string }>)[0]!.text;
}

const run = isE2EAvailable() ? describe : describe.skip;

run('wallet errors e2e', () => {
  let client: Awaited<ReturnType<typeof createStdioClient>>['client'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const harness = await createStdioClient();
    client = harness.client;
    cleanup = harness.cleanup;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  it('get_portfolio without connect_wallet returns wallet error', async () => {
    const result = await client.callTool({
      name: 'get_portfolio',
      arguments: {},
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('connect_wallet');
  });

  it('activate_agent without wallet returns wallet error', async () => {
    const result = await client.callTool({
      name: 'activate_agent',
      arguments: {
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        token: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        protocols: ['Aave'],
        txHash: '0xabc123',
      },
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('connect_wallet');
  });

  it('disconnect_wallet without prior connect returns no-wallet message', async () => {
    const result = await client.callTool({
      name: 'disconnect_wallet',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    expect(getText(result)).toContain('No wallet');
  });
});
