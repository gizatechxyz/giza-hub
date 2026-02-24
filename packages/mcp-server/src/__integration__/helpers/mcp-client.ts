import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { GizaServer } from '../../server.js';
import { allTools } from '../../tools/index.js';
import { DEFAULT_SYSTEM_PROMPT } from '../../prompt.js';
import type { ResolvedServerConfig, ToolDefinition } from '../../types.js';
import type { Giza } from '@gizatech/agent-sdk';
import { createMockGiza } from './mock-giza.js';

interface HarnessOverrides {
  tools?: ToolDefinition[];
  systemPrompt?: string;
}

interface TestHarness {
  client: Client;
  server: GizaServer;
  mockGiza: ReturnType<typeof createMockGiza>;
  cleanup: () => Promise<void>;
}

export async function createTestHarness(
  overrides?: HarnessOverrides,
): Promise<TestHarness> {
  const mockGiza = createMockGiza();

  const config: ResolvedServerConfig = {
    giza: mockGiza as unknown as Giza,
    tools: overrides?.tools ?? allTools,
    systemPrompt: overrides?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    name: 'giza-test-server',
    version: '0.0.1-test',
    transport: 'stdio',
    port: 3000,
  };

  const server = new GizaServer(config);
  const [serverTransport, clientTransport] =
    InMemoryTransport.createLinkedPair();

  await server.mcp.connect(serverTransport);

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: { tools: {}, prompts: {} } },
  );
  await client.connect(clientTransport);

  const cleanup = async () => {
    await client.close();
    await serverTransport.close();
    await clientTransport.close();
  };

  return { client, server, mockGiza, cleanup };
}
