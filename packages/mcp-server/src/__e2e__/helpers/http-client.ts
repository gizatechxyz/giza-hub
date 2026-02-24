import { resolve } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

interface HttpTestClient {
  client: Client;
  serverProcess: ChildProcess;
  cleanup: () => Promise<void>;
}

const DEFAULT_ENV: Record<string, string> = {
  GIZA_API_KEY: 'test-key',
  GIZA_PARTNER_NAME: 'test',
  GIZA_API_URL: 'https://api.test.giza.tech',
  GIZA_CHAIN_ID: '8453',
  NODE_ENV: 'test',
};

async function waitForHealth(
  port: number,
  timeoutMs = 10000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}/health`);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms`);
}

export async function createHttpClient(
  port: number,
  env?: Record<string, string>,
): Promise<HttpTestClient> {
  const cliPath = resolve(process.cwd(), 'dist', 'cli.js');

  const serverProcess = spawn('node', [cliPath], {
    env: {
      ...process.env,
      ...DEFAULT_ENV,
      TRANSPORT: 'http',
      PORT: String(port),
      ...env,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  await waitForHealth(port);

  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${port}/mcp`),
  );

  const client = new Client(
    { name: 'e2e-http-client', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {} } },
  );

  await client.connect(transport);

  const cleanup = async () => {
    await client.close();
    serverProcess.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      serverProcess.on('exit', () => resolve());
      setTimeout(() => {
        serverProcess.kill('SIGKILL');
        resolve();
      }, 3000);
    });
  };

  return { client, serverProcess, cleanup };
}
