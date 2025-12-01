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
import { API_ERROR_RESPONSES } from '../helpers/mock-responses';

describe('SmartAccount Integration', () => {
  let agent: GizaAgent;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    setupTestEnv();
    agent = new GizaAgent({ chainId: Chain.BASE });

    // Mock the underlying axios instance
    const httpClient = (agent.smartAccount as any).httpClient;
    const axiosInstance = (httpClient as any).axiosInstance;
    mockAxios = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mockAxios.restore();
    restoreEnv();
  });

  describe('create smart account', () => {
    it('should create smart account with full flow', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await agent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });

      // Verify request was made
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('/api/v1/proxy/zerodev/smart-accounts');
      
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData).toEqual({
        eoa: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
        agent_id: 'arma-dev',
      });
    });

    it('should include authentication headers', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          expect(config.headers?.['Content-Type']).toBe('application/json');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await agent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });
    });

    it('should handle 401 Unauthorized error', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(401, API_ERROR_RESPONSES.UNAUTHORIZED);

      await expect(
        agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GizaAPIError);
        expect((error as GizaAPIError).statusCode).toBe(401);
        expect((error as GizaAPIError).message).toContain('Unauthorized');
      }
    });

    it('should handle 400 Bad Request error', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(400, API_ERROR_RESPONSES.BAD_REQUEST);

      await expect(
        agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        });
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(400);
        expect((error as GizaAPIError).friendlyMessage).toBe(
          'Invalid request. Please check your parameters.'
        );
      }
    });

    it('should handle 500 Server Error', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(500, API_ERROR_RESPONSES.SERVER_ERROR);

      await expect(
        agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        });
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(500);
        expect((error as GizaAPIError).message).toContain('Server Error');
      }
    });

    it('should handle network errors', async () => {
      mockAxios.onPost('/api/v1/proxy/zerodev/smart-accounts').networkError();

      await expect(
        agent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(NetworkError);
    });

    it('should create accounts on different chains', async () => {
      // Create BASE agent
      const baseAgent = new GizaAgent({ chainId: Chain.BASE });
      const baseMock = new MockAdapter(
        ((baseAgent.smartAccount as any).httpClient as any).axiosInstance
      );
      baseMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const baseResult = await baseAgent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(baseResult.chain).toBe(Chain.BASE);

      // Create ARBITRUM agent
      const arbitrumAgent = new GizaAgent({ chainId: Chain.ARBITRUM });
      const arbitrumMock = new MockAdapter(
        ((arbitrumAgent.smartAccount as any).httpClient as any).axiosInstance
      );
      arbitrumMock
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_2);

      const arbitrumResult = await arbitrumAgent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_2,
      });

      expect(arbitrumResult.chain).toBe(Chain.ARBITRUM);

      baseMock.restore();
      arbitrumMock.restore();
    });
  });

  describe('get smart account info', () => {
    it('should get account info with full flow', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await agent.smartAccount.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });

      // Verify request
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toContain('/api/v1/proxy/zerodev/smart-accounts?');
      expect(mockAxios.history.get[0].url).toContain(`chain=${Chain.BASE}`);
      expect(mockAxios.history.get[0].url).toContain(`eoa=${VALID_ADDRESSES.EOA_1}`);
      expect(mockAxios.history.get[0].url).toContain('agent_id=arma-dev');
    });

    it('should handle 404 Not Found error', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(404, API_ERROR_RESPONSES.NOT_FOUND);

      await expect(
        agent.smartAccount.getInfo({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(GizaAPIError);

      try {
        await agent.smartAccount.getInfo({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        });
      } catch (error) {
        expect((error as GizaAPIError).statusCode).toBe(404);
        expect((error as GizaAPIError).friendlyMessage).toBe(
          'Resource not found. Please check the address or parameters.'
        );
      }
    });

    it('should include auth headers in get request', async () => {
      mockAxios
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply((config) => {
          expect(config.headers?.['X-Partner-API-Key']).toBe('test-api-key-12345');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await agent.smartAccount.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });
    });

    it('should use custom agent ID in query', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'custom-agent-id',
      });
      const customMock = new MockAdapter(
        ((customAgent.smartAccount as any).httpClient as any).axiosInstance
      );

      customMock
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply((config) => {
          expect(config.url).toContain('agent_id=custom-agent-id');
          return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
        });

      await customAgent.smartAccount.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      customMock.restore();
    });
  });

  describe('retry behavior', () => {
    it('should retry on 5xx errors when enabled', async () => {
      const retryAgent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });
      const retryMock = new MockAdapter(
        ((retryAgent.smartAccount as any).httpClient as any).axiosInstance
      );

      let callCount = 0;
      retryMock.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(() => {
        callCount++;
        if (callCount === 1) {
          return [500, { message: 'Server error' }];
        }
        return [200, MOCK_SMART_ACCOUNT_RESPONSE_1];
      });

      const result = await retryAgent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
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
        ((retryAgent.smartAccount as any).httpClient as any).axiosInstance
      );

      let callCount = 0;
      retryMock.onPost('/api/v1/proxy/zerodev/smart-accounts').reply(() => {
        callCount++;
        return [400, { message: 'Bad request' }];
      });

      await expect(
        retryAgent.smartAccount.create({
          origin_wallet: VALID_ADDRESSES.EOA_1,
        })
      ).rejects.toThrow(GizaAPIError);

      expect(callCount).toBe(1); // No retry for 4xx

      retryMock.restore();
    });
  });

  describe('multiple sequential requests', () => {
    it('should handle multiple create requests', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_1)
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .replyOnce(200, MOCK_SMART_ACCOUNT_RESPONSE_2);

      const result1 = await agent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      const result2 = await agent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_2,
      });

      expect(result1.smartAccountAddress).toBe(MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount);
      expect(result2.smartAccountAddress).toBe(MOCK_SMART_ACCOUNT_RESPONSE_2.smartAccount);
      expect(mockAxios.history.post).toHaveLength(2);
    });

    it('should handle create followed by getInfo', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1)
        .onGet(/\/api\/v1\/proxy\/zerodev\/smart-accounts\?.*/)
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      // Create account
      const createResult = await agent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      // Get account info
      const getResult = await agent.smartAccount.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(createResult.smartAccountAddress).toBe(getResult.smartAccountAddress);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('timeout behavior', () => {
    it('should respect custom timeout setting', async () => {
      const timeoutAgent = new GizaAgent({
        chainId: Chain.BASE,
        timeout: 5000,
      });

      const httpClient = (timeoutAgent.smartAccount as any).httpClient;
      const axiosInstance = (httpClient as any).axiosInstance;
      
      expect(axiosInstance.defaults.timeout).toBe(5000);
    });
  });

  describe('response data validation', () => {
    it('should handle response with all expected fields', async () => {
      mockAxios
        .onPost('/api/v1/proxy/zerodev/smart-accounts')
        .reply(200, MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await agent.smartAccount.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(result).toHaveProperty('smartAccountAddress');
      expect(result).toHaveProperty('backendWallet');
      expect(result).toHaveProperty('origin_wallet');
      expect(result).toHaveProperty('chain');
      expect(typeof result.smartAccountAddress).toBe('string');
      expect(typeof result.backendWallet).toBe('string');
      expect(typeof result.origin_wallet).toBe('string');
      expect(typeof result.chain).toBe('number');
    });
  });
});

