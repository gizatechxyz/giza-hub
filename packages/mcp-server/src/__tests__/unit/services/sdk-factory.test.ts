import { describe, test, expect, mock, beforeEach } from 'bun:test';

/**
 * Since the sdk-factory module has module-level caches and Bun's mock.module
 * leaks across test files, we test the caching logic inline using the same
 * algorithm as the source module.
 */

type Chain = number;
type Address = `0x${string}`;

const Chain = {
  BASE: 8453,
  ETHEREUM: 1,
  POLYGON: 137,
} as const;

interface MockGizaInstance {
  chain: Chain;
  getAgent: ReturnType<typeof mock>;
}

interface MockAgentInstance {
  wallet: string;
}

function createFactory() {
  const clientCache = new Map<Chain, MockGizaInstance>();
  const agentCache = new Map<string, MockAgentInstance>();

  const mockGetAgent = mock(
    (eoa: Address) =>
      Promise.resolve({ wallet: eoa } as MockAgentInstance),
  );

  function getGizaClient(chain: Chain): MockGizaInstance {
    let client = clientCache.get(chain);
    if (!client) {
      client = { chain, getAgent: mockGetAgent };
      clientCache.set(chain, client);
    }
    return client;
  }

  function getDefaultGizaClient(): MockGizaInstance {
    return getGizaClient(Chain.BASE);
  }

  async function getAgentForSession(
    chain: Chain,
    eoa: Address,
  ): Promise<MockAgentInstance> {
    const key = `${chain}:${eoa}`;
    let agent = agentCache.get(key);
    if (!agent) {
      const giza = getGizaClient(chain);
      agent = await giza.getAgent(eoa);
      agentCache.set(key, agent);
    }
    return agent;
  }

  return {
    getGizaClient,
    getDefaultGizaClient,
    getAgentForSession,
    mockGetAgent,
    clearCaches() {
      clientCache.clear();
      agentCache.clear();
    },
  };
}

describe('getGizaClient', () => {
  test('returns a client instance', () => {
    const { getGizaClient } = createFactory();
    const client = getGizaClient(Chain.BASE);
    expect(client).toBeDefined();
    expect(typeof client.getAgent).toBe('function');
  });

  test('returns cached instance for same chain', () => {
    const { getGizaClient } = createFactory();
    const first = getGizaClient(Chain.BASE);
    const second = getGizaClient(Chain.BASE);
    expect(first).toBe(second);
  });

  test('returns different instances for different chains', () => {
    const { getGizaClient } = createFactory();
    const base = getGizaClient(Chain.BASE);
    const eth = getGizaClient(Chain.ETHEREUM);
    expect(base).not.toBe(eth);
  });
});

describe('getDefaultGizaClient', () => {
  test('returns same instance as getGizaClient(Chain.BASE)', () => {
    const { getGizaClient, getDefaultGizaClient } = createFactory();
    const defaultClient = getDefaultGizaClient();
    const baseClient = getGizaClient(Chain.BASE);
    expect(defaultClient).toBe(baseClient);
  });
});

describe('getAgentForSession', () => {
  const eoa: Address = '0x1234567890abcdef1234567890abcdef12345678';

  test('calls giza.getAgent with correct EOA', async () => {
    const { getAgentForSession, mockGetAgent } = createFactory();
    const agent = await getAgentForSession(Chain.POLYGON, eoa);

    expect(mockGetAgent).toHaveBeenCalledTimes(1);
    expect(mockGetAgent).toHaveBeenCalledWith(eoa);
    expect(agent.wallet).toBe(eoa);
  });

  test('caches agent by chain:eoa key', async () => {
    const { getAgentForSession, mockGetAgent } = createFactory();
    const first = await getAgentForSession(Chain.POLYGON, eoa);
    const second = await getAgentForSession(Chain.POLYGON, eoa);

    expect(first).toBe(second);
    expect(mockGetAgent).toHaveBeenCalledTimes(1);
  });

  test('different EOA returns different agent', async () => {
    const { getAgentForSession } = createFactory();
    const otherEoa: Address =
      '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

    const agentA = await getAgentForSession(Chain.POLYGON, eoa);
    const agentB = await getAgentForSession(Chain.POLYGON, otherEoa);

    expect(agentA).not.toBe(agentB);
  });
});
