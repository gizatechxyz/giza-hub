import { createTestHarness } from './helpers/mcp-client.js';
import { walletTools, protocolTools } from '../tools/index.js';

describe('cherry-picked tools', () => {
  it('registering only walletTools exposes 2 tools', async () => {
    const { client, cleanup } = await createTestHarness({
      tools: walletTools,
    });
    try {
      const result = await client.listTools();
      expect(result.tools).toHaveLength(2);
      const names = result.tools.map((t) => t.name);
      expect(names).toContain('connect_wallet');
      expect(names).toContain('disconnect_wallet');
    } finally {
      await cleanup();
    }
  });

  it('registering walletTools + protocolTools exposes 6 tools', async () => {
    const { client, cleanup } = await createTestHarness({
      tools: [...walletTools, ...protocolTools],
    });
    try {
      const result = await client.listTools();
      expect(result.tools).toHaveLength(6);
    } finally {
      await cleanup();
    }
  });

  it('calling a non-registered tool returns an error', async () => {
    const { client, cleanup } = await createTestHarness({
      tools: walletTools,
    });
    try {
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      const text = (
        result.content as Array<{ type: string; text: string }>
      )[0]!.text;
      expect(text).toContain('not found');
    } finally {
      await cleanup();
    }
  });
});
