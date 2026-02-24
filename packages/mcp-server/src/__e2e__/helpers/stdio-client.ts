import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Check if the built CLI exists. E2E tests require `bun run build` first.
 * Returns false when run from the wrong working directory (e.g. `bun test`
 * from the monorepo root) or when the build is missing.
 */
export function isE2EAvailable(): boolean {
  return existsSync(resolve(process.cwd(), 'dist', 'cli.js'));
}

interface StdioTestClient {
  client: Client;
  cleanup: () => Promise<void>;
}

const DEFAULT_ENV: Record<string, string> = {
  GIZA_API_KEY: 'test-key',
  GIZA_PARTNER_NAME: 'test',
  GIZA_API_URL: 'https://api.test.giza.tech',
  CHAIN_ID: '8453',
  NODE_ENV: 'test',
};

export async function createStdioClient(
  env?: Record<string, string>,
): Promise<StdioTestClient> {
  const cliPath = resolve(process.cwd(), 'dist', 'cli.js');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [cliPath],
    env: { ...DEFAULT_ENV, ...env },
    stderr: 'pipe',
  });

  const client = new Client(
    { name: 'e2e-stdio-client', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {} } },
  );

  await client.connect(transport);

  const cleanup = async () => {
    await client.close();
  };

  return { client, cleanup };
}
