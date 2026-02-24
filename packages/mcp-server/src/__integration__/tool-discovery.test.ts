import { createTestHarness } from './helpers/mcp-client.js';
import { allTools } from '../tools/index.js';

const EXPECTED_TOOL_NAMES = new Set(allTools.map((t) => t.name));

describe('tool discovery', () => {
  let client: Awaited<ReturnType<typeof createTestHarness>>['client'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const harness = await createTestHarness();
    client = harness.client;
    cleanup = harness.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('listTools returns exactly the expected number of tools', async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(allTools.length);
  });

  it('each tool has name, description, and inputSchema with type object', async () => {
    const result = await client.listTools();
    for (const tool of result.tools) {
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe('string');
      expect(tool.description!.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('tool names are unique', async () => {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('tool names match the expected hardcoded set', async () => {
    const result = await client.listTools();
    const actualNames = new Set(result.tools.map((t) => t.name));
    expect(actualNames).toEqual(EXPECTED_TOOL_NAMES);
  });
});
