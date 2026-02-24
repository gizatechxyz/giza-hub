import { createHttpClient } from './helpers/http-client.js';
import { isE2EAvailable } from './helpers/stdio-client.js';
import { allTools } from '../tools/index.js';

const PORT = 39123;
const VALID_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

function getText(result: { content: unknown }): string {
  return (result.content as Array<{ type: string; text: string }>)[0]!.text;
}

const run = isE2EAvailable() ? describe : describe.skip;

run('http transport e2e', () => {
  let client: Awaited<ReturnType<typeof createHttpClient>>['client'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const harness = await createHttpClient(PORT);
    client = harness.client;
    cleanup = harness.cleanup;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  it('/health returns ok', async () => {
    const res = await fetch(`http://localhost:${PORT}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('unknown routes return 404', async () => {
    const res = await fetch(`http://localhost:${PORT}/nonexistent`);
    expect(res.status).toBe(404);
  });

  it('MCP client connects and lists tools', async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(allTools.length);
  });

  it('connect_wallet works through HTTP transport', async () => {
    const result = await client.callTool({
      name: 'connect_wallet',
      arguments: { wallet: VALID_WALLET },
    });
    expect(result.isError).toBeFalsy();
    expect(getText(result)).toContain('connected');
  });
});
