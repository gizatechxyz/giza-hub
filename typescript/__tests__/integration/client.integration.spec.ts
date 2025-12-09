import MockAdapter from 'axios-mock-adapter';
import { GizaAgent } from '../../src/client';
import { Chain } from '../../src/types/common';
import { setupTestEnv, restoreEnv } from '../helpers/test-env';
import { VALID_ADDRESSES } from '../fixtures/addresses';
import {
  MOCK_SMART_ACCOUNT_RESPONSE_1,
  MOCK_SMART_ACCOUNT_RESPONSE_2,
} from '../fixtures/accounts';

describe('GizaAgent Client Integration', () => {
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

  describe('full client initialization', () => {
    it('should initialize with agent module accessible', () => {
      expect(giza).toBeInstanceOf(GizaAgent);
      expect(giza.agent).toBeDefined();
      expect(typeof giza.getChainId).toBe('function');
      expect(typeof giza.getBackendUrl).toBe('function');
      expect(typeof giza.getAgentId).toBe('function');
      expect(typeof giza.getConfig).toBe('function');
    });

    it('should have working getter methods', () => {
      expect(giza.getChainId()).toBe(Chain.BASE);
      expect(giza.getBackendUrl()).toBe('https://api.test.giza.example');
      expect(giza.getAgentId()).toBe('giza-app');

      const config = giza.getConfig();
      expect(config.chainId).toBe(Chain.BASE);
      expect(config.backendUrl).toBe('https://api.test.giza.example');
      expect(config.agentId).toBe('giza-app');
      expect(config.timeout).toBe(45000);
      expect(config.enableRetry).toBe(false);
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

      // Test POST request
      await giza.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      // Test GET request
      await giza.agent.getSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should use API key from environment variable', async () => {
      process.env.GIZA_API_KEY = 'custom-api-key-from-env';
      
      const customAgent = new GizaAgent({ chainId: Chain.BASE });
      const customMock = new MockAdapter(
        ((customAgent.agent as any).httpClient as any).axiosInstance
      );

      customMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('custom-api-key-from-env');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await customAgent.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      customMock.restore();
    });
  });

  describe('multiple sequential API calls', () => {
    it('should handle create, getSmartAccount, create sequence', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_1)
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_1)
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_2);

      // First create
      const create1 = await giza.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });
      expect(create1.smartAccountAddress).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);

      // Get info
      const info = await giza.agent.getSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });
      expect(info.smartAccountAddress).toBe(create1.smartAccountAddress);

      // Second create
      const create2 = await giza.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_2,
      });
      expect(create2.smartAccountAddress).toBe(MOCK_SMART_ACCOUNT_RESPONSE_2.smartAccount);

      expect(mockAxios.history.post).toHaveLength(2);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should maintain state between calls', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const results = await Promise.all([
        giza.agent.createSmartAccount({ origin_wallet: VALID_ADDRESSES.EOA_1 }),
        giza.agent.createSmartAccount({ origin_wallet: VALID_ADDRESSES.EOA_1 }),
        giza.agent.createSmartAccount({ origin_wallet: VALID_ADDRESSES.EOA_1 }),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.chain).toBe(Chain.BASE);
        expect(result.origin_wallet).toBe(VALID_ADDRESSES.EOA_1);
      });

      expect(mockAxios.history.post).toHaveLength(3);
    });
  });

  describe('config variations', () => {
    it('should work with custom agent ID', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'custom-agent-123',
      });
      const customMock = new MockAdapter(
        ((customAgent.agent as any).httpClient as any).axiosInstance
      );

      customMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          const body = JSON.parse(config.data);
          expect(body.agent_id).toBe('custom-agent-123');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await customAgent.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      customMock.restore();
    });

    it('should work with custom timeout', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        timeout: 30000,
      });

      expect(customAgent.getConfig().timeout).toBe(30000);

      const httpClient = (customAgent.agent as any).httpClient;
      const axiosInstance = (httpClient as any).axiosInstance;
      expect(axiosInstance.defaults.timeout).toBe(30000);
    });

    it('should work with retry enabled', async () => {
      const retryAgent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });

      expect(retryAgent.getConfig().enableRetry).toBe(true);
    });

    it('should work with ARBITRUM chain', async () => {
      const arbitrumAgent = new GizaAgent({
        chainId: Chain.ARBITRUM,
      });
      const arbitrumMock = new MockAdapter(
        ((arbitrumAgent.agent as any).httpClient as any).axiosInstance
      );

      arbitrumMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          const body = JSON.parse(config.data);
          expect(body.chain).toBe(Chain.ARBITRUM);
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_2];
        });

      const result = await arbitrumAgent.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_2,
      });

      expect(result.chain).toBe(Chain.ARBITRUM);
      arbitrumMock.restore();
    });
  });

  describe('error handling across client', () => {
    it('should propagate errors from agent module', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(500, {
        message: 'Internal server error',
      });

      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow();
    });

    it('should handle network failures gracefully', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').networkError();

      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent creates', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const promises = Array.from({ length: 5 }, (_, i) =>
        giza.agent.createSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockAxios.history.post).toHaveLength(5);
    });

    it('should handle concurrent getSmartAccount calls', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const promises = Array.from({ length: 3 }, () =>
        giza.agent.getSmartAccount({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAxios.history.get).toHaveLength(3);
    });
  });

  describe('baseURL configuration', () => {
    it('should use backend URL from config', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.baseURL).toBe('https://api.test.giza.example');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await giza.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });
    });

    it('should work with custom backend URL from environment', async () => {
      process.env.GIZA_API_URL = 'https://custom.backend.url';

      const customAgent = new GizaAgent({ chainId: Chain.BASE });
      const customMock = new MockAdapter(
        ((customAgent.agent as any).httpClient as any).axiosInstance
      );

      customMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.baseURL).toBe('https://custom.backend.url');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await customAgent.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      customMock.restore();
    });
  });

  describe('lifecycle', () => {
    it('should support creating multiple agent instances', () => {
      const agent1 = new GizaAgent({ chainId: Chain.BASE });
      const agent2 = new GizaAgent({ chainId: Chain.ARBITRUM });
      const agent3 = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'custom',
      });

      expect(agent1.getChainId()).toBe(Chain.BASE);
      expect(agent2.getChainId()).toBe(Chain.ARBITRUM);
      expect(agent3.getAgentId()).toBe('custom');
    });

    it('should maintain independent state per instance', async () => {
      const agent1 = new GizaAgent({ chainId: Chain.BASE });
      const mock1 = new MockAdapter(
        ((agent1.agent as any).httpClient as any).axiosInstance
      );

      const agent2 = new GizaAgent({ chainId: Chain.ARBITRUM });
      const mock2 = new MockAdapter(
        ((agent2.agent as any).httpClient as any).axiosInstance
      );

      mock1
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      mock2
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_2);

      const result1 = await agent1.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      const result2 = await agent2.agent.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_2,
      });

      expect(result1.chain).toBe(Chain.BASE);
      expect(result2.chain).toBe(Chain.ARBITRUM);

      mock1.restore();
      mock2.restore();
    });
  });
});
