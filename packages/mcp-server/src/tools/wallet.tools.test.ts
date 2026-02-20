import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WalletContextStore } from '../context.js';
import { registerWalletTools } from './wallet.tools.js';
import type { Address } from '@gizatech/agent-sdk';

function createMockSdk() {
  return {
    agent: {
      getSmartAccount: vi.fn(),
    },
    getChainId: vi.fn().mockReturnValue(8453),
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

describe('wallet tools', () => {
  let server: McpServer;
  let sdk: ReturnType<typeof createMockSdk>;
  let walletStore: WalletContextStore;
  const sessionId = 'test-session';

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '0.0.1' });
    sdk = createMockSdk();
    walletStore = new WalletContextStore();
  });

  it('connect_wallet stores wallet and checks for smart account', async () => {
    sdk.agent.getSmartAccount.mockResolvedValue({
      smartAccountAddress: '0x1234567890abcdef1234567890abcdef12345678' as Address,
      origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address,
      backendWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
      chain: 8453,
    });

    const tools = captureTools(server);
    registerWalletTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('connect_wallet')!;
    const result = await handler({
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    });

    expect(walletStore.get(sessionId)).toBe(
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    );
    expect(result.content[0].text).toContain('connected');
    expect(result.content[0].text).toContain('Smart account found');
  });

  it('connect_wallet handles no existing smart account', async () => {
    sdk.agent.getSmartAccount.mockRejectedValue(new Error('Not found'));

    const tools = captureTools(server);
    registerWalletTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('connect_wallet')!;
    const result = await handler({
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    });

    expect(result.content[0].text).toContain('No smart account found');
  });

  it('disconnect_wallet removes wallet from store', async () => {
    walletStore.set(sessionId, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address);

    const tools = captureTools(server);
    registerWalletTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('disconnect_wallet')!;
    const result = await handler({});

    expect(walletStore.has(sessionId)).toBe(false);
    expect(result.content[0].text).toContain('disconnected');
  });
});
