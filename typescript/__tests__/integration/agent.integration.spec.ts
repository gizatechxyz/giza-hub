import MockAdapter from 'axios-mock-adapter';
import { GizaAgent } from '../../src/client';
import { Chain } from '../../src/types/common';
import { GizaAPIError, NetworkError } from '../../src/http/errors';
import { setupTestEnv, restoreEnv } from '../helpers/test-env';
import { VALID_ADDRESSES } from '../fixtures/addresses';
import {
  MOCK_SMART_ACCOUNT_RESPONSE_1,
  MOCK_SMART_ACCOUNT_RESPONSE_2,
} from '../fixtures/accounts';
import {
  MOCK_PERFORMANCE_CHART_RESPONSE,
  MOCK_AGENT_INFO,
  MOCK_TRANSACTION_HISTORY_PAGE_1,
  MOCK_APR_RESPONSE,
} from '../fixtures/performance';
import { API_ERROR_RESPONSES } from '../helpers/mock-responses';

describe('Agent Module Integration', () => {
  let giza: GizaAgent;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    setupTestEnv();
    giza = new GizaAgent({ chainId: Chain.BASE });

    // Mock the underlying axios instance
    const httpClient = (giza.agent as any).httpClient;
    const axiosInstance = (httpClient as any).axiosInstance;
    mockAxios = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mockAxios.restore();
    restoreEnv();
  });

  // ============================================================================
  // Smart Account Operations
  // ============================================================================

  describe('createSmartAccount', () => {
    it('should create smart account with full flow', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await giza.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });

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

      await giza.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });
    });

    it('should handle 401 Unauthorized error', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(401, API_ERROR_RESPONSES.UNAUTHORIZED);

      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(GizaAPIError);
    });

    it('should handle network errors', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').networkError();

      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(NetworkError);
    });
  });

  describe('getSmartAccount', () => {
    it('should get account info with full flow', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await giza.agent.getSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });
    });
  });

  // ============================================================================
  // Protocol Operations
  // ============================================================================

  describe('getProtocols', () => {
    it('should get available protocols', async () => {
      const mockProtocols = {
        protocols: [
          { name: 'aave', available: true, description: 'Aave protocol', tvl: 1000, apy: 5.0 },
          { name: 'compound', available: true, description: 'Compound protocol', tvl: 2000, apy: 4.5 },
          { name: 'morpho', available: true, description: 'Morpho protocol', tvl: 500, apy: 6.0 },
        ],
      };
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/.*/protocols`))
        .reply(200, mockProtocols);

      const result = await giza.agent.getProtocols(VALID_ADDRESSES.EOA_1);

      expect(result.protocols).toEqual(['aave', 'compound', 'morpho']);
    });
  });

  describe('updateProtocols', () => {
    it('should update selected protocols', async () => {
      mockAxios
        .onPut(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/protocols`))
        .reply(204);

      await giza.agent.updateProtocols(
        VALID_ADDRESSES.SMART_ACCOUNT_1,
        ['aave', 'compound']
      );

      expect(mockAxios.history.put).toHaveLength(1);
      const requestData = JSON.parse(mockAxios.history.put[0].data);
      expect(requestData).toEqual(['aave', 'compound']);
    });
  });

  // ============================================================================
  // Activation Operations
  // ============================================================================

  describe('activate', () => {
    it('should activate agent with full flow', async () => {
      const mockResponse = { message: 'Agent starting activation', wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 };
      mockAxios
        .onPost(`/api/v1/${Chain.BASE}/wallets`)
        .reply(201, mockResponse);

      const result = await giza.agent.activate({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        initial_token: VALID_ADDRESSES.EOA_2,
        selected_protocols: ['aave', 'compound'],
        tx_hash: '0x1234567890',
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

      const result = await giza.agent.deactivate({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        transfer: true,
      });

      expect(result.message).toBe('Wallet deactivation initiated');
    });
  });

  describe('topUp', () => {
    it('should top up agent', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:top-up`))
        .reply(201, { message: 'Top-up process started' });

      const result = await giza.agent.topUp({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        tx_hash: '0x1234567890',
      });

      expect(result.message).toBe('Top-up process started');
    });
  });

  describe('run', () => {
    it('should run agent', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:run`))
        .reply(200, { status: 'success' });

      const result = await giza.agent.run({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe('success');
    });
  });

  // ============================================================================
  // Performance Operations
  // ============================================================================

  describe('getPerformance', () => {
    it('should get performance data', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/performance`))
        .reply(200, MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await giza.agent.getPerformance({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.performance).toHaveLength(2);
    });

    it('should include from_date in query', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/performance`))
        .reply((config) => {
          expect(config.url).toContain('from_date=2024-01-01');
          return [200, MOCK_PERFORMANCE_CHART_RESPONSE];
        });

      await giza.agent.getPerformance({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        from_date: '2024-01-01',
      });
    });
  });

  describe('getPortfolio', () => {
    it('should get portfolio data', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}$`))
        .reply(200, MOCK_AGENT_INFO);

      const result = await giza.agent.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe('active');
      expect(result.deposits).toHaveLength(1);
    });
  });

  describe('getAPR', () => {
    it('should get APR data', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/apr`))
        .reply(200, MOCK_APR_RESPONSE);

      const result = await giza.agent.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.apr).toBe(12.5);
    });
  });

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  describe('getTransactions', () => {
    it('should get transaction history', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/transactions`))
        .reply(200, MOCK_TRANSACTION_HISTORY_PAGE_1);

      const result = await giza.agent.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.transactions).toHaveLength(3);
      expect(result.pagination.total_items).toBe(25);
    });
  });

  // ============================================================================
  // Withdrawal Operations
  // ============================================================================

  describe('withdraw', () => {
    it('should initiate full withdrawal (deactivate) when no amount specified', async () => {
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:deactivate`))
        .reply(201, { message: 'Wallet deactivation initiated' });

      const result = await giza.agent.withdraw({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        transfer: true,
      });

      expect((result as any).message).toBe('Wallet deactivation initiated');
    });

    it('should initiate partial withdrawal when amount is specified', async () => {
      const mockPartialResponse = {
        date: '2024-03-01T00:00:00Z',
        total_value: 1000,
        total_value_in_usd: 1000,
        withdraw_details: [
          { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: 1000000000, value: 1000, value_in_usd: 1000 }
        ],
      };
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:withdraw`))
        .reply(200, mockPartialResponse);

      const result = await giza.agent.withdraw({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        amount: '1000000000',
      });

      expect((result as any).total_value).toBe(1000);
      expect((result as any).withdraw_details).toHaveLength(1);
    });
  });

  describe('getFees', () => {
    it('should get fee information', async () => {
      const mockFees = { percentage_fee: 0.1, fee: 100.5 };
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/fee`))
        .reply(200, mockFees);

      const result = await giza.agent.getFees(VALID_ADDRESSES.SMART_ACCOUNT_1);

      expect(result.percentage_fee).toBe(0.1);
      expect(result.fee).toBe(100.5);
    });
  });

  // ============================================================================
  // Rewards Operations
  // ============================================================================

  describe('claimRewards', () => {
    it('should claim rewards', async () => {
      const mockRewards = {
        rewards: [
          { token: '0x1234', amount: 1000, amount_float: 0.001, current_price_in_underlying: 1.5 }
        ]
      };
      mockAxios
        .onPost(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*:claim-rewards`))
        .reply(200, mockRewards);

      const result = await giza.agent.claimRewards(VALID_ADDRESSES.SMART_ACCOUNT_1);

      expect(result.rewards).toHaveLength(1);
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
        await giza.agent.createSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        });
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(500);
        expect((error as GizaAPIError).message).toContain('Server Error');
      }
    });

    it('should handle 404 Not Found error', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/${Chain.BASE}/wallets/.*/performance`))
        .reply(404, API_ERROR_RESPONSES.WALLET_NOT_FOUND);

      await expect(
        giza.agent.getPerformance({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);
    });
  });

  // ============================================================================
  // Retry Behavior
  // ============================================================================

  describe('retry behavior', () => {
    it('should retry on 5xx errors when enabled', async () => {
      const retryAgent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });
      const retryMock = new MockAdapter(
        ((retryAgent.agent as any).httpClient as any).axiosInstance
      );

      let callCount = 0;
      retryMock.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(() => {
        callCount++;
        if (callCount === 1) {
          return [500, { message: 'Server error' }];
        }
        return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
      });

      const result = await retryAgent.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(result).toBeDefined();
      expect(callCount).toBe(2);

      retryMock.restore();
    });
  });
});

