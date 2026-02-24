import MockAdapter from 'axios-mock-adapter';
import { Giza } from '../../src/giza';
import { Chain } from '../../src/types/common';
import { setupTestEnv, restoreEnv } from '../helpers/test-env';
import { VALID_ADDRESSES } from '../fixtures/addresses';
import {
  MOCK_SMART_ACCOUNT_RESPONSE_1,
  MOCK_SMART_ACCOUNT_RESPONSE_2,
} from '../fixtures/accounts';

describe('Giza Client Integration', () => {
  let giza: Giza;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    setupTestEnv();
    giza = new Giza({ chain: Chain.BASE });

    const httpClient = (giza as any).httpClient;
    const axiosInstance = (httpClient as any).axiosInstance;
    mockAxios = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mockAxios.restore();
    restoreEnv();
  });

  describe('full client initialization', () => {
    it('should initialize with working accessors', () => {
      expect(giza).toBeInstanceOf(Giza);
      expect(typeof giza.getChain).toBe('function');
      expect(typeof giza.getApiUrl).toBe('function');
    });

    it('should have working getter methods', () => {
      expect(giza.getChain()).toBe(Chain.BASE);
      expect(giza.getApiUrl()).toBe('https://api.test.giza.example');
    });
  });

  describe('authentication header propagation', () => {
    it('should include API key in all requests', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        })
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await giza.createAgent(VALID_ADDRESSES.EOA_1);
      await giza.getAgent(VALID_ADDRESSES.EOA_1);

      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should use API key from environment variable', async () => {
      process.env.GIZA_API_KEY = 'custom-api-key-from-env';

      const customGiza = new Giza({ chain: Chain.BASE });
      const customMock = new MockAdapter(
        ((customGiza as any).httpClient as any).axiosInstance
      );

      customMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('custom-api-key-from-env');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await customGiza.createAgent(VALID_ADDRESSES.EOA_1);
      customMock.restore();
    });
  });

  describe('multiple sequential API calls', () => {
    it('should handle createAgent, getAgent, createAgent sequence', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_1)
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_1)
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_2);

      const agent1 = await giza.createAgent(VALID_ADDRESSES.EOA_1);
      expect(agent1.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);

      const agent2 = await giza.getAgent(VALID_ADDRESSES.EOA_1);
      expect(agent2.wallet).toBe(agent1.wallet);

      const agent3 = await giza.createAgent(VALID_ADDRESSES.EOA_2);
      expect(agent3.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_2.smartAccount);

      expect(mockAxios.history.post).toHaveLength(2);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should maintain state between calls', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const results = await Promise.all([
        giza.createAgent(VALID_ADDRESSES.EOA_1),
        giza.createAgent(VALID_ADDRESSES.EOA_1),
        giza.createAgent(VALID_ADDRESSES.EOA_1),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((agent) => {
        expect(agent.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);
      });

      expect(mockAxios.history.post).toHaveLength(3);
    });
  });

  describe('config variations', () => {
    it('should work with custom timeout', () => {
      const customGiza = new Giza({ chain: Chain.BASE, timeout: 30000 });

      const httpClient = (customGiza as any).httpClient;
      const axiosInstance = (httpClient as any).axiosInstance;
      expect(axiosInstance.defaults.timeout).toBe(30000);
    });

    it('should work with retry enabled', () => {
      const retryGiza = new Giza({ chain: Chain.BASE, enableRetry: true });
      expect(retryGiza).toBeInstanceOf(Giza);
    });

    it('should work with ARBITRUM chain', async () => {
      const arb = new Giza({ chain: Chain.ARBITRUM });
      const arbMock = new MockAdapter(
        ((arb as any).httpClient as any).axiosInstance
      );

      arbMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          const body = JSON.parse(config.data);
          expect(body.chain).toBe(Chain.ARBITRUM);
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_2];
        });

      const agent = await arb.createAgent(VALID_ADDRESSES.EOA_2);
      expect(agent.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_2.smartAccount);

      arbMock.restore();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from createAgent', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(500, {
        message: 'Internal server error',
      });

      await expect(giza.createAgent(VALID_ADDRESSES.EOA_1)).rejects.toThrow();
    });

    it('should handle network failures', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').networkError();

      await expect(giza.createAgent(VALID_ADDRESSES.EOA_1)).rejects.toThrow();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent creates', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const promises = Array.from({ length: 5 }, () =>
        giza.createAgent(VALID_ADDRESSES.EOA_1)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockAxios.history.post).toHaveLength(5);
    });

    it('should handle concurrent getAgent calls', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const promises = Array.from({ length: 3 }, () =>
        giza.getAgent(VALID_ADDRESSES.EOA_1)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAxios.history.get).toHaveLength(3);
    });
  });

  describe('baseURL configuration', () => {
    it('should use API URL from config', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.baseURL).toBe('https://api.test.giza.example');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await giza.createAgent(VALID_ADDRESSES.EOA_1);
    });

    it('should work with custom API URL from environment', async () => {
      process.env.GIZA_API_URL = 'https://custom.backend.url';

      const customGiza = new Giza({ chain: Chain.BASE });
      const customMock = new MockAdapter(
        ((customGiza as any).httpClient as any).axiosInstance
      );

      customMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.baseURL).toBe('https://custom.backend.url');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await customGiza.createAgent(VALID_ADDRESSES.EOA_1);
      customMock.restore();
    });
  });

  describe('lifecycle', () => {
    it('should support creating multiple Giza instances', () => {
      const g1 = new Giza({ chain: Chain.BASE });
      const g2 = new Giza({ chain: Chain.ARBITRUM });

      expect(g1.getChain()).toBe(Chain.BASE);
      expect(g2.getChain()).toBe(Chain.ARBITRUM);
    });

    it('should maintain independent state per instance', async () => {
      const g1 = new Giza({ chain: Chain.BASE });
      const mock1 = new MockAdapter(((g1 as any).httpClient as any).axiosInstance);

      const g2 = new Giza({ chain: Chain.ARBITRUM });
      const mock2 = new MockAdapter(((g2 as any).httpClient as any).axiosInstance);

      mock1.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);
      mock2.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(200, MOCK_SMART_ACCOUNT_RESPONSE_2);

      const agent1 = await g1.createAgent(VALID_ADDRESSES.EOA_1);
      const agent2 = await g2.createAgent(VALID_ADDRESSES.EOA_2);

      expect(agent1.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);
      expect(agent2.wallet).toBe(MOCK_SMART_ACCOUNT_RESPONSE_2.smartAccount);

      mock1.restore();
      mock2.restore();
    });
  });
});
