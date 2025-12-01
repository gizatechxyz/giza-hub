import MockAdapter from 'axios-mock-adapter';
import { GizaAgent } from '../../src/client';
import { Chain } from '../../src/types/common';
import { SortOrder } from '../../src/types/performance';
import { GizaAPIError, NetworkError } from '../../src/http/errors';
import { setupTestEnv, restoreEnv } from '../helpers/test-env';
import { VALID_ADDRESSES } from '../fixtures/addresses';
import {
  MOCK_PERFORMANCE_CHART_RESPONSE,
  MOCK_PERFORMANCE_CHART_EMPTY,
  MOCK_AGENT_INFO,
  MOCK_AGENT_INFO_DEACTIVATED,
  MOCK_TRANSACTION_HISTORY_PAGE_1,
  MOCK_TRANSACTION_HISTORY_PAGE_2,
  MOCK_TRANSACTION_HISTORY_EMPTY,
  MOCK_APR_RESPONSE,
  MOCK_APR_RESPONSE_NO_DETAILS,
} from '../fixtures/performance';
import { API_ERROR_RESPONSES } from '../helpers/mock-responses';

describe('Performance Integration', () => {
  let agent: GizaAgent;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    setupTestEnv();
    agent = new GizaAgent({ chainId: Chain.BASE });

    const httpClient = (agent.performance as any).httpClient;
    const axiosInstance = (httpClient as any).axiosInstance;
    mockAxios = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mockAxios.restore();
    restoreEnv();
  });

  describe('getChart', () => {
    it('should fetch chart with full flow', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(200, MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await agent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toEqual(MOCK_PERFORMANCE_CHART_RESPONSE);
      expect(result.performance).toHaveLength(2);
      expect(result.performance[0].value).toBe(1000.5);

      // Verify request was made
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toContain('/performance');
    });

    it('should include authentication headers', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          expect(config.headers?.['Content-Type']).toBe('application/json');
          return [200, MOCK_PERFORMANCE_CHART_RESPONSE];
        });

      await agent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
    });

    it('should handle from_date parameter', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance\\?.*`)
        )
        .reply((config) => {
          expect(config.url).toContain('from_date=');
          return [200, MOCK_PERFORMANCE_CHART_RESPONSE];
        });

      await agent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        from_date: '2024-01-01 00:00:00',
      });
    });

    it('should handle 401 Unauthorized error', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(401, API_ERROR_RESPONSES.UNAUTHORIZED);

      await expect(
        agent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GizaAPIError);
        expect((error as GizaAPIError).statusCode).toBe(401);
      }
    });

    it('should handle 404 Not Found error', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(404, API_ERROR_RESPONSES.WALLET_NOT_FOUND);

      await expect(
        agent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        });
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(404);
      }
    });

    it('should handle 500 Server Error', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(500, API_ERROR_RESPONSES.SERVER_ERROR);

      await expect(
        agent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);
    });

    it('should handle network errors', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .networkError();

      await expect(
        agent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(NetworkError);
    });

    it('should work on different chains', async () => {
      const arbitrumAgent = new GizaAgent({ chainId: Chain.ARBITRUM });
      const arbitrumMock = new MockAdapter(
        ((arbitrumAgent.performance as any).httpClient as any).axiosInstance
      );

      arbitrumMock
        .onGet(
          `/api/v1/agents/${Chain.ARBITRUM}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(200, MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await arbitrumAgent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toBeDefined();
      expect(arbitrumMock.history.get[0].url).toContain(`/agents/${Chain.ARBITRUM}/`);

      arbitrumMock.restore();
    });

    it('should handle empty performance data', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(200, MOCK_PERFORMANCE_CHART_EMPTY);

      const result = await agent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.performance).toHaveLength(0);
    });
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio with full flow', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply(200, MOCK_AGENT_INFO);

      const result = await agent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toEqual(MOCK_AGENT_INFO);
      expect(result.wallet).toBe(VALID_ADDRESSES.SMART_ACCOUNT_1);
      expect(result.status).toBe('ACTIVE');

      // Verify request was made
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should include authentication headers', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_AGENT_INFO];
        });

      await agent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
    });

    it('should handle origin_wallet parameter', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}\\?.*`))
        .reply((config) => {
          expect(config.url).toContain('eoa=true');
          return [200, MOCK_AGENT_INFO];
        });

      await agent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: true,
      });
    });

    it('should handle 404 error responses', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply(404, API_ERROR_RESPONSES.WALLET_NOT_FOUND);

      await expect(
        agent.performance.getPortfolio({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);
    });

    it('should respect custom agent ID', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'custom-agent-id',
      });
      const customMock = new MockAdapter(
        ((customAgent.performance as any).httpClient as any).axiosInstance
      );

      customMock
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply(200, MOCK_AGENT_INFO);

      const result = await customAgent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toBeDefined();

      customMock.restore();
    });

    it('should handle deactivated wallet status', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply(200, MOCK_AGENT_INFO_DEACTIVATED);

      const result = await agent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe('DEACTIVATED');
      expect(result.last_deactivation_date).toBeDefined();
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with pagination', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply(200, MOCK_TRANSACTION_HISTORY_PAGE_1);

      const result = await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toEqual(MOCK_TRANSACTION_HISTORY_PAGE_1);
      expect(result.transactions).toHaveLength(3);
      expect(result.pagination.total_items).toBe(25);
      expect(result.pagination.current_page).toBe(1);

      // Verify request
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toContain('page=1');
      expect(mockAxios.history.get[0].url).toContain('limit=20');
    });

    it('should handle multiple pages', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .replyOnce(200, MOCK_TRANSACTION_HISTORY_PAGE_1)
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .replyOnce(200, MOCK_TRANSACTION_HISTORY_PAGE_2);

      const page1 = await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        page: 1,
      });

      const page2 = await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        page: 2,
      });

      expect(page1.pagination.current_page).toBe(1);
      expect(page2.pagination.current_page).toBe(2);
      expect(mockAxios.history.get).toHaveLength(2);
    });

    it('should include authentication headers', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_TRANSACTION_HISTORY_PAGE_1];
        });

      await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
    });

    it('should enforce limit constraints', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply((config) => {
          expect(config.url).toContain('limit=100');
          return [200, MOCK_TRANSACTION_HISTORY_PAGE_1];
        });

      await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        limit: 200, // Should be capped at 100
      });
    });

    it('should handle sort parameter', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply((config) => {
          expect(config.url).toContain('sort=date_desc');
          return [200, MOCK_TRANSACTION_HISTORY_PAGE_1];
        });

      await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        sort: SortOrder.DATE_DESC,
      });
    });

    it('should handle empty transaction history', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply(200, MOCK_TRANSACTION_HISTORY_EMPTY);

      const result = await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.total_items).toBe(0);
    });

    it('should handle 403 Forbidden error', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply(403, { message: 'Access denied', statusCode: 403 });

      await expect(
        agent.performance.getTransactions({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);
    });
  });

  describe('getAPR', () => {
    it('should fetch APR with full flow', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply(200, MOCK_APR_RESPONSE);

      const result = await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toEqual(MOCK_APR_RESPONSE);
      expect(result.apr).toBe(12.5);
      expect(result.sub_periods).toHaveLength(2);

      // Verify request was made
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toContain('/apr');
    });

    it('should handle date range parameters', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr\\?.*`))
        .reply((config) => {
          expect(config.url).toContain('start_date=');
          expect(config.url).toContain('end_date=');
          return [200, MOCK_APR_RESPONSE];
        });

      await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
      });
    });

    it('should handle use_exact_end_date parameter', async () => {
      mockAxios
        .onGet(new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr\\?.*`))
        .reply((config) => {
          expect(config.url).toContain('use_exact_end_date=true');
          return [200, MOCK_APR_RESPONSE];
        });

      await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        use_exact_end_date: true,
      });
    });

    it('should include authentication headers', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_APR_RESPONSE];
        });

      await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
    });

    it('should handle insufficient data errors', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply(400, API_ERROR_RESPONSES.INSUFFICIENT_APR_DATA);

      await expect(
        agent.performance.getAPR({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.performance.getAPR({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        });
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(400);
        expect((error as GizaAPIError).message).toContain('Not enough historical data');
      }
    });

    it('should handle APR without sub_periods', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply(200, MOCK_APR_RESPONSE_NO_DETAILS);

      const result = await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.apr).toBe(15.3);
      expect(result.sub_periods).toBeUndefined();
    });

    it('should handle invalid date format error', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply(400, API_ERROR_RESPONSES.INVALID_DATE_FORMAT);

      await expect(
        agent.performance.getAPR({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          start_date: 'invalid-date',
        })
      ).rejects.toThrow(GizaAPIError);
    });
  });

  describe('retry behavior', () => {
    it('should retry on 5xx errors when enabled', async () => {
      const retryAgent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });
      const retryMock = new MockAdapter(
        ((retryAgent.performance as any).httpClient as any).axiosInstance
      );

      let callCount = 0;
      retryMock
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(() => {
          callCount++;
          if (callCount === 1) {
            return [500, { message: 'Server error' }];
          }
          return [200, MOCK_PERFORMANCE_CHART_RESPONSE];
        });

      const result = await retryAgent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toBeDefined();
      expect(callCount).toBe(2); // Original + 1 retry

      retryMock.restore();
    });

    it('should not retry 4xx errors even when retry enabled', async () => {
      const retryAgent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });
      const retryMock = new MockAdapter(
        ((retryAgent.performance as any).httpClient as any).axiosInstance
      );

      let callCount = 0;
      retryMock
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(() => {
          callCount++;
          return [400, { message: 'Bad request' }];
        });

      await expect(
        retryAgent.performance.getChart({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(GizaAPIError);

      expect(callCount).toBe(1); // No retry for 4xx

      retryMock.restore();
    });
  });

  describe('timeout behavior', () => {
    it('should respect custom timeout setting', async () => {
      const timeoutAgent = new GizaAgent({
        chainId: Chain.BASE,
        timeout: 5000,
      });

      const httpClient = (timeoutAgent.performance as any).httpClient;
      const axiosInstance = (httpClient as any).axiosInstance;

      expect(axiosInstance.defaults.timeout).toBe(5000);
    });
  });

  describe('multiple sequential requests', () => {
    it('should handle multiple different requests', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(200, MOCK_PERFORMANCE_CHART_RESPONSE)
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply(200, MOCK_AGENT_INFO)
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply(200, MOCK_TRANSACTION_HISTORY_PAGE_1)
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply(200, MOCK_APR_RESPONSE);

      // Execute all four methods
      const chart = await agent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
      const portfolio = await agent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
      const transactions = await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });
      const apr = await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(chart).toBeDefined();
      expect(portfolio).toBeDefined();
      expect(transactions).toBeDefined();
      expect(apr).toBeDefined();
      expect(mockAxios.history.get).toHaveLength(4);
    });
  });

  describe('response data validation', () => {
    it('should handle chart response with all expected fields', async () => {
      mockAxios
        .onGet(
          `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
        )
        .reply(200, MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await agent.performance.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toHaveProperty('performance');
      expect(Array.isArray(result.performance)).toBe(true);
      expect(result.performance[0]).toHaveProperty('date');
      expect(result.performance[0]).toHaveProperty('value');
    });

    it('should handle portfolio response with all expected fields', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`)
        .reply(200, MOCK_AGENT_INFO);

      const result = await agent.performance.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toHaveProperty('wallet');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('deposits');
      expect(result).toHaveProperty('selected_protocols');
      expect(Array.isArray(result.deposits)).toBe(true);
    });

    it('should handle transaction response with pagination', async () => {
      mockAxios
        .onGet(
          new RegExp(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions\\?.*`)
        )
        .reply(200, MOCK_TRANSACTION_HISTORY_PAGE_1);

      const result = await agent.performance.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('total_items');
      expect(result.pagination).toHaveProperty('current_page');
    });

    it('should handle APR response structure', async () => {
      mockAxios
        .onGet(`/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`)
        .reply(200, MOCK_APR_RESPONSE);

      const result = await agent.performance.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result).toHaveProperty('apr');
      expect(typeof result.apr).toBe('number');
      if (result.sub_periods) {
        expect(Array.isArray(result.sub_periods)).toBe(true);
      }
    });
  });
});

