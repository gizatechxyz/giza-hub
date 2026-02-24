import type { Giza, Address } from '@gizatech/agent-sdk';

const STUB_WALLET = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;

function createMockAgent() {
  return {
    portfolio: jest.fn().mockResolvedValue({
      wallet: STUB_WALLET,
      status: 'activated',
    }),
    performance: jest.fn().mockResolvedValue({ performance: [] }),
    apr: jest.fn().mockResolvedValue({ apr: 5.5 }),
    deposits: jest.fn().mockResolvedValue({
      deposits: [{ amount: 100, token_type: 'USDC' }],
    }),
    activate: jest.fn().mockResolvedValue({ status: 'activating' }),
    deactivate: jest.fn().mockResolvedValue({ message: 'Agent deactivated' }),
    topUp: jest.fn().mockResolvedValue({ message: 'Top-up recorded' }),
    run: jest.fn().mockResolvedValue({ status: 'running' }),
    withdraw: jest.fn().mockResolvedValue({ status: 'withdrawing' }),
    status: jest.fn().mockResolvedValue({ status: 'idle' }),
    transactions: jest.fn().mockReturnValue({
      first: jest.fn().mockResolvedValue([
        { hash: '0xabc', type: 'deposit' },
      ]),
    }),
    fees: jest.fn().mockResolvedValue({ feePercent: 0.5 }),
    claimRewards: jest.fn().mockResolvedValue({ rewards: [] }),
  };
}

export function createMockGiza(): Giza & { __mockAgent: ReturnType<typeof createMockAgent> } {
  const mockAgent = createMockAgent();

  const giza = {
    __mockAgent: mockAgent,
    agent: jest.fn().mockReturnValue(mockAgent),
    createAgent: jest.fn().mockResolvedValue({ wallet: STUB_WALLET }),
    getSmartAccount: jest.fn().mockResolvedValue({
      wallet: STUB_WALLET,
      chain: 8453,
    }),
    protocols: jest.fn().mockResolvedValue([
      { name: 'Aave', address: '0x1' },
    ]),
    tokens: jest.fn().mockResolvedValue([
      { symbol: 'USDC', decimals: 6, address: '0x2' },
    ]),
    stats: jest.fn().mockResolvedValue({
      totalBalance: '1000000',
      users: 42,
    }),
    tvl: jest.fn().mockResolvedValue({ tvl: '5000000' }),
    optimize: jest.fn().mockResolvedValue({
      allocations: [{ protocol: 'Aave', share: 0.6 }],
    }),
  } as unknown as Giza & { __mockAgent: ReturnType<typeof createMockAgent> };

  return giza;
}
