import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WalletContextStore } from '../context.js';
import { registerFinancialTools } from './financial.tools.js';
import type { Address } from '@gizatech/agent-sdk';

function createMockSdk() {
  return {
    agent: {
      withdraw: vi.fn(),
      getWithdrawalStatus: vi.fn(),
      getTransactions: vi.fn(),
      getDeposits: vi.fn(),
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

describe('financial tools', () => {
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

  it('withdraw handles partial withdrawal', async () => {
    sdk.agent.withdraw.mockResolvedValue({
      date: '2025-02-20T00:00:00Z',
      total_value: 500,
      total_value_in_usd: 500,
      withdraw_details: [
        { token: '0xUSDC', amount: 500, value: 500, value_in_usd: 500 },
      ],
    });

    const tools = captureTools(server);
    registerFinancialTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('withdraw')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
      amount: '500000000',
    });

    expect(result.content[0].text).toContain('Partial withdrawal');
    expect(result.content[0].text).toContain('$500.00');
  });

  it('withdraw handles full withdrawal', async () => {
    sdk.agent.withdraw.mockResolvedValue({ message: 'Withdrawal initiated' });

    const tools = captureTools(server);
    registerFinancialTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('withdraw')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('Full withdrawal');
  });

  it('get_withdrawal_status returns status', async () => {
    sdk.agent.getWithdrawalStatus.mockResolvedValue({
      status: 'deactivating',
      wallet: SMART_ACCOUNT,
      activation_date: '2025-01-15T00:00:00Z',
    });

    const tools = captureTools(server);
    registerFinancialTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('get_withdrawal_status')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('Deactivating');
  });

  it('get_transactions returns transaction list', async () => {
    sdk.agent.getTransactions.mockResolvedValue({
      transactions: [
        {
          action: 'DEPOSIT',
          date: '2025-01-15T00:00:00Z',
          amount: 1000,
          token_type: 'USDC',
          status: 'SUCCESS',
        },
      ],
      pagination: {
        total_items: 1,
        total_pages: 1,
        current_page: 1,
        items_per_page: 20,
      },
    });

    const tools = captureTools(server);
    registerFinancialTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('get_transactions')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('DEPOSIT');
    expect(result.content[0].text).toContain('USDC');
  });

  it('get_deposits returns deposit list', async () => {
    sdk.agent.getDeposits.mockResolvedValue({
      deposits: [
        { amount: 1000, token_type: 'USDC', date: '2025-01-15T00:00:00Z' },
      ],
    });

    const tools = captureTools(server);
    registerFinancialTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('get_deposits')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('USDC');
    expect(result.content[0].text).toContain('1000');
  });

  it('get_deposits handles empty list', async () => {
    sdk.agent.getDeposits.mockResolvedValue({ deposits: [] });

    const tools = captureTools(server);
    registerFinancialTools(server, sdk as never, walletStore, sessionId);

    const handler = tools.get('get_deposits')!;
    const result = await handler({
      smart_account_address: SMART_ACCOUNT,
    });

    expect(result.content[0].text).toContain('No deposits found');
  });
});
