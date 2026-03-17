import { mock } from 'bun:test';

export function mockPaginator(items: unknown[] = []) {
  return {
    page: mock(() =>
      Promise.resolve({
        data: items,
        total: items.length,
        page: 1,
        limit: 20,
      }),
    ),
    first: mock(() => Promise.resolve(items)),
    [Symbol.asyncIterator]: async function* () {
      for (const item of items) {
        yield item;
      }
    },
  };
}

export function createMockAgent() {
  return {
    wallet: '0x1234567890abcdef1234567890abcdef12345678' as const,
    activate: mock(() => Promise.resolve({ status: 'activating' })),
    deactivate: mock(() => Promise.resolve({ status: 'deactivating' })),
    topUp: mock(() => Promise.resolve({ status: 'ok' })),
    run: mock(() => Promise.resolve({ status: 'running' })),
    portfolio: mock(() =>
      Promise.resolve({ deposits: [], status: 'activated' }),
    ),
    performance: mock(() =>
      Promise.resolve({ data: [{ date: '2025-01-01', value: 100 }] }),
    ),
    apr: mock(() => Promise.resolve({ apr: 5.5 })),
    aprByTokens: mock(() => Promise.resolve({ tokens: [] })),
    deposits: mock(() => Promise.resolve({ deposits: [] })),
    transactions: mock(() => mockPaginator()),
    executions: mock(() => mockPaginator()),
    executionLogs: mock(() => mockPaginator()),
    logs: mock(() => mockPaginator()),
    rewards: mock(() => mockPaginator()),
    rewardHistory: mock(() => mockPaginator()),
    withdraw: mock(() => Promise.resolve({ status: 'pending' })),
    status: mock(() => Promise.resolve({ status: 'active' })),
    fees: mock(() => Promise.resolve({ fee: '0.1' })),
    limit: mock(() => Promise.resolve({ limit: '1000000' })),
    claimRewards: mock(() => Promise.resolve({ claimed: true })),
    protocols: mock(() => Promise.resolve([{ name: 'aave' }])),
    updateProtocols: mock(() => Promise.resolve()),
    constraints: mock(() => Promise.resolve([{ kind: 'min_protocols' }])),
    updateConstraints: mock(() => Promise.resolve()),
    waitForDeactivation: mock(() =>
      Promise.resolve({ status: 'deactivated' }),
    ),
    whitelist: mock(() => Promise.resolve([])),
  };
}

export function createMockGiza(mockAgent = createMockAgent()) {
  return {
    health: mock(() => Promise.resolve({ status: 'healthy' })),
    getApiConfig: mock(() =>
      Promise.resolve({ version: '1.0', features: [] }),
    ),
    stats: mock(() =>
      Promise.resolve({ tvl: '1000000', activeAgents: 42 }),
    ),
    tvl: mock(() => Promise.resolve({ tvl: '1000000' })),
    chains: mock(() => Promise.resolve({ chain_ids: [1, 137, 8453] })),
    tokens: mock(() =>
      Promise.resolve({ tokens: [{ symbol: 'USDC' }] }),
    ),
    protocols: mock(() =>
      Promise.resolve({ protocols: [{ name: 'aave' }] }),
    ),
    protocolSupply: mock(() =>
      Promise.resolve({ supply: [{ protocol: 'aave', amount: '500000' }] }),
    ),
    createAgent: mock(() => Promise.resolve(mockAgent)),
    getAgent: mock(() => Promise.resolve(mockAgent)),
    getSmartAccount: mock(() =>
      Promise.resolve({
        eoa: '0x1234567890abcdef1234567890abcdef12345678',
        smartAccount: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      }),
    ),
    getChain: mock(() => 8453),
    getApiUrl: mock(() => 'https://api.test.giza.tech'),
  };
}
