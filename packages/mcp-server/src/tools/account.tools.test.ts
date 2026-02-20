import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WalletContextStore } from '../context.js';
import { registerAccountTools } from './account.tools.js';
import type { Address } from '@gizatech/agent-sdk';

function createMockSdk() {
  return {
    agent: {
      createSmartAccount: vi.fn(),
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

const WALLET: Address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const SMART_ACCOUNT: Address = '0x1234567890abcdef1234567890abcdef12345678';

describe('account tools', () => {
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

  it('create_smart_account creates an account', async () => {
    sdk.agent.createSmartAccount.mockResolvedValue({
      smartAccountAddress: SMART_ACCOUNT,
      backendWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
      origin_wallet: WALLET,
      chain: 8453,
    });

    const tools = captureTools(server);
    registerAccountTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('create_smart_account')!;
    const result = await handler({});

    expect(sdk.agent.createSmartAccount).toHaveBeenCalledWith({
      origin_wallet: WALLET,
    });
    expect(result.content[0].text).toContain('Smart account created');
    expect(result.content[0].text).toContain(SMART_ACCOUNT);
  });

  it('create_smart_account errors when no wallet connected', async () => {
    walletStore.remove(sessionId);

    const tools = captureTools(server);
    registerAccountTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('create_smart_account')!;
    const result = await handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No wallet connected');
  });

  it('get_smart_account returns account info', async () => {
    sdk.agent.getSmartAccount.mockResolvedValue({
      smartAccountAddress: SMART_ACCOUNT,
      backendWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
      origin_wallet: WALLET,
      chain: 8453,
    });

    const tools = captureTools(server);
    registerAccountTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('get_smart_account')!;
    const result = await handler({});

    expect(result.content[0].text).toContain('Smart account on Base');
  });
});
