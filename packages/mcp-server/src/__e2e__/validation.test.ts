import { createStdioClient, isE2EAvailable } from './helpers/stdio-client.js';

const run = isE2EAvailable() ? describe : describe.skip;

run('validation e2e', () => {
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

  it('connect_wallet with empty string returns validation error', async () => {
    const result = await client.callTool({
      name: 'connect_wallet',
      arguments: { wallet: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('connect_wallet with non-hex address returns validation error', async () => {
    const result = await client.callTool({
      name: 'connect_wallet',
      arguments: { wallet: '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ' },
    });
    expect(result.isError).toBe(true);
  });
});
