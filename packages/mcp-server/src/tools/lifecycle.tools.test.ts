import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WalletContextStore } from '../context.js';
import { registerLifecycleTools } from './lifecycle.tools.js';
import type { Address } from '@gizatech/agent-sdk';

function createMockSdk() {
  return {
    agent: {
      activate: vi.fn(),
      deactivate: vi.fn(),
      topUp: vi.fn(),
      run: vi.fn(),
    },
  };
}

function captureTools(server: McpServer) {
  const tools = new Map<string, Function>();
  const originalTool = server.tool.bind(server);
  server.tool = ((...args: unknown[]) => {
    const name = args[0] as string;
    const handler = args[args.length - 1] as Function;
    tools.set(name, handler);
    return originalTool(...(args as Parameters<typeof originalTool>));
  }) as typeof server.tool;
  return tools;
}

const WALLET: Address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const SMART_ACCOUNT: Address = '0x1234567890abcdef1234567890abcdef12345678';
const TOKEN: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

describe('lifecycle tools', () => {
  let server: McpServer;
  let sdk: ReturnType<typeof createMockSdk>;
  let walletStore: WalletContextStore;
  const sessionId = 'test-session';

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' });
    sdk = createMockSdk();
    walletStore = new WalletContextStore();
    walletStore.set(sessionId, WALLET);
  });

  it('activate_agent activates successfully', async () => {
    sdk.agent.activate.mockResolvedValue({
      message: 'Agent activated',
      wallet: SMART_ACCOUNT,
    });

    const tools = captureTools(server);
    registerLifecycleTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('activate_agent')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
      initial_token: TOKEN,
      selected_protocols: ['aave', 'compound'],
    });

    expect(result.content[0].text).toContain('Agent activated');
    expect(result.content[0].text).toContain('aave, compound');
  });

  it('deactivate_agent deactivates successfully', async () => {
    sdk.agent.deactivate.mockResolvedValue({ message: 'Agent deactivated' });

    const tools = captureTools(server);
    registerLifecycleTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('deactivate_agent')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('Agent deactivated');
  });

  it('top_up registers top-up', async () => {
    sdk.agent.topUp.mockResolvedValue({ message: 'Top-up processed' });

    const tools = captureTools(server);
    registerLifecycleTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('top_up')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
      tx_hash: '0xabc123',
    });

    expect(result.content[0].text).toContain('Top-up registered');
  });

  it('run_agent triggers a run', async () => {
    sdk.agent.run.mockResolvedValue({ status: 'running' });

    const tools = captureTools(server);
    registerLifecycleTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('run_agent')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('Agent run triggered');
    expect(result.content[0].text).toContain('running');
  });
});
