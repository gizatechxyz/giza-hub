import MockAdapter from 'axios-mock-adapter';
import { Giza } from '../../src/giza';
import { Agent } from '../../src/agent';
import { Chain } from '../../src/types/common';
import { GizaAPIError, NetworkError } from '../../src/http/errors';
import { setupTestEnv, restoreEnv } from '../helpers/test-env';
import { VALID_ADDRESSES } from '../fixtures/addresses';
import {
  MOCK_SMART_ACCOUNT_RESPONSE_1,
} from '../fixtures/accounts';
import {
  MOCK_PERFORMANCE_CHART_RESPONSE,
  MOCK_AGENT_INFO,
  MOCK_TRANSACTION_HISTORY_PAGE_1,
  MOCK_APR_RESPONSE,
} from '../fixtures/performance';
import { API_ERROR_RESPONSES } from '../helpers/mock-responses';

describe('Agent Integration', () => {
  let giza: Giza;
  let agent: Agent;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    setupTestEnv();
    giza = new Giza({ chain: Chain.BASE });

    const httpClient = (giza as any).httpClient;
    const axiosInstance = (httpClient as any).axiosInstance;
    mockAxios = new MockAdapter(axiosInstance);

    // Create an agent handle for testing wallet-scoped operations
    agent = giza.agent(VALID_ADDRESSES.SMART_ACCOUNT_1);
  });

  afterEach(() => {
    mockAxios.restore();
    restoreEnv();
  });

  // ============================================================================
  // Smart Account Operations (on Giza)
  // ============================================================================

  describe('createAgent', () => {
    it('should create smart account with full flow', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const created = await giza.createAgent(VALID_ADDRESSES.EOA_1);

      expect(created.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);
      expect(mockAxios.history.post).toHaveLength(1);

      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData).toEqual({
        eoa: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
        agent_id: 'giza-app',
      });
    });

    it('should include authentication headers', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await giza.createAgent(VALID_ADDRESSES.EOA_1);
    });

    it('should handle 401 Unauthorized error', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(401, API_ERROR_RESPONSES.UNAUTHORIZED);

      await expect(giza.createAgent(VALID_ADDRESSES.EOA_1)).rejects.toThrow(GizaAPIError);
    });

    it('should handle network errors', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').networkError();

      await expect(giza.createAgent(VALID_ADDRESSES.EOA_1)).rejects.toThrow(NetworkError);
    });
  });

  describe('getAgent', () => {
    it('should get account info with full flow', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const found = await giza.getAgent(VALID_ADDRESSES.EOA_1);

      expect(found.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);
    });
  });

  // ============================================================================
  // Protocol Operations (on Giza)
  // ============================================================================

  describe('protocols', () => {
    it('should get available protocols', async () => {
      const mockProtocols = {
        protocols: [
          { name: 'aave', is_active: true, description: 'Aave', tvl: 1000, apr: 5.0 },
          { name: 'compound', is_active: true, description: 'Compound', tvl: 2000, apr: 4.5 },
          { name: 'morpho', is_active: true, description: 'Morpho', tvl: 500, apr: 6.0 },
        ],
      };
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/.*/protocols`))
        .reply(200, mockProtocols);

      const result = await giza.protocols(VALID_ADDRESSES.EOA_1);

      expect(result.protocols).toEqual(['aave', 'compound', 'morpho']);
    });
  });

  // ============================================================================
  // Agent Wallet-Scoped Operations
  // ============================================================================

  describe('activate', () => {
    it('should activate agent with full flow', async () => {
      const mockResponse = { message: 'Agent starting activation', wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 };
      mockAxios
        .onPost(`/api/v1/${Chain.BASE}/wallets`)
        .reply(201, mockResponse);

      const result = await agent.activate({
        owner: VALID_ADDRESSES.EOA_1,
        token: VALID_ADDRESSES.EOA_2,
        protocols: ['aave', 'compound'],
        txHash: '0x1234567890',
      });

      expect(result.message).toBe('Agent starting activation');
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('deactivate', () => {
    it('should deactivate agent', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:deactivate`))
        .reply(201, { message: 'Wallet deactivation initiated' });

      const result = await agent.deactivate({ transfer: true });

      expect(result.message).toBe('Wallet deactivation initiated');
    });
  });

  describe('topUp', () => {
    it('should top up agent', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:top-up`))
        .reply(201, { message: 'Top-up process started' });

      const validTxHash = '0x' + 'ab'.repeat(32);
      const result = await agent.topUp(validTxHash);

      expect(result.message).toBe('Top-up process started');
    });
  });

  describe('run', () => {
    it('should run agent', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:run`))
        .reply(200, { status: 'success' });

      const result = await agent.run();

      expect(result.status).toBe('success');
    });
  });

  // ============================================================================
  // Performance Operations
  // ============================================================================

  describe('performance', () => {
    it('should get performance data', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/performance`))
        .reply(200, MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await agent.performance();

      expect(result.performance).toHaveLength(2);
    });

    it('should include from_date in query', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/performance`))
        .reply((config) => {
          expect(config.url).toContain('from_date=2024-01-01');
          return [200, MOCK_PERFORMANCE_CHART_RESPONSE];
        });

      await agent.performance({ from: '2024-01-01' });
    });
  });

  describe('portfolio', () => {
    it('should get portfolio data', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}$`))
        .reply(200, MOCK_AGENT_INFO);

      const result = await agent.portfolio();

      expect(result.status).toBe('activated');
      expect(result.deposits).toHaveLength(1);
    });
  });

  describe('apr', () => {
    it('should get APR data', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/apr`))
        .reply(200, MOCK_APR_RESPONSE);

      const result = await agent.apr();

      expect(result.apr).toBe(12.5);
    });
  });

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  describe('transactions', () => {
    it('should get transaction history via paginator', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/transactions`))
        .reply(200, MOCK_TRANSACTION_HISTORY_PAGE_1);

      const txs = await agent.transactions().first();

      expect(txs).toHaveLength(3);
    });
  });

  // ============================================================================
  // Withdrawal Operations
  // ============================================================================

  describe('withdraw', () => {
    it('should initiate full withdrawal when no amount specified', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:deactivate`))
        .reply(201, { message: 'Wallet deactivation initiated' });

      const result = await agent.withdraw();

      expect((result as any).message).toBe('Wallet deactivation initiated');
    });

    it('should initiate partial withdrawal when amount is specified', async () => {
      const mockPartialResponse = {
        date: '2024-03-01T00:00:00Z',
        amount: 1000,
        value: 1000,
        withdraw_details: [
          { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: '1000000000', value: 1000, value_in_usd: 1000 },
        ],
      };
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:withdraw`))
        .reply(200, mockPartialResponse);

      const result = await agent.withdraw('1000000000');

      expect((result as any).amount).toBe(1000);
      expect((result as any).withdraw_details).toHaveLength(1);
    });
  });

  describe('fees', () => {
    it('should get fee information', async () => {
      const mockFees = { percentage_fee: 0.1, fee: 100.5 };
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/fee`))
        .reply(200, mockFees);

      const result = await agent.fees();

      expect(result.percentage_fee).toBe(0.1);
      expect(result.fee).toBe(100.5);
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe('error handling', () => {
    it('should handle 500 Server Error', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(500, API_ERROR_RESPONSES.SERVER_ERROR);

      try {
        await giza.createAgent(VALID_ADDRESSES.EOA_1);
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(500);
        expect((error as GizaAPIError).message).toContain('Server Error');
      }
    });

    it('should handle 404 Not Found error', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/performance`))
        .reply(404, API_ERROR_RESPONSES.WALLET_NOT_FOUND);

      await expect(agent.performance()).rejects.toThrow(GizaAPIError);
    });
  });

  // ============================================================================
  // Retry Behavior
  // ============================================================================

  describe('retry behavior', () => {
    it('should retry on 5xx errors when enabled', async () => {
      const retryGiza = new Giza({ chain: Chain.BASE, enableRetry: true });
      const retryMock = new MockAdapter(
        ((retryGiza as any).httpClient as any).axiosInstance
      );

      let callCount = 0;
      retryMock.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(() => {
        callCount++;
        if (callCount === 1) {
          return [500, { message: 'Server error' }];
        }
        return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
      });

      const result = await retryGiza.createAgent(VALID_ADDRESSES.EOA_1);

      expect(result).toBeDefined();
      expect(callCount).toBe(2);

      retryMock.restore();
    });
  });
});
