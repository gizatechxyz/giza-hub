import { createStdioClient, isE2EAvailable } from './helpers/stdio-client.js';
import { allTools } from '../tools/index.js';

const VALID_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const INVALID_WALLET = 'not-a-wallet';

function getText(result: { content: unknown }): string {
  return (result.content as Array<{ type: string; text: string }>)[0]!.text;
}

const run = isE2EAvailable() ? describe : describe.skip;

run('stdio transport e2e', () => {
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

  it('client connects to spawned CLI process', () => {
    expect(client).toBeDefined();
  });

  it('listTools returns all tools', async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(allTools.length);
  });

  it('listPrompts returns system prompt', async () => {
    const result = await client.listPrompts();
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0]!.name).toBe('system');
  });

  it('connect_wallet with valid address succeeds', async () => {
    const result = await client.callTool({
      name: 'connect_wallet',
      arguments: { wallet: VALID_WALLET },
    });
    expect(result.isError).toBeFalsy();
    expect(getText(result)).toContain('connected');
  });

  it('connect_wallet with invalid address returns error', async () => {
    const result = await client.callTool({
      name: 'connect_wallet',
      arguments: { wallet: INVALID_WALLET },
    });
    expect(result.isError).toBe(true);
  });
});
