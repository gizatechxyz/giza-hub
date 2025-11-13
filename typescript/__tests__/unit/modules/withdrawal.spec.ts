import { WithdrawalModule } from '../../../src/modules/withdrawal.module';
import { HttpClient } from '../../../src/http/client';
import { Chain, ValidationError } from '../../../src/types/common';
import { ResolvedGizaAgentConfig } from '../../../src/types/config';
import { AgentStatus, TxAction } from '../../../src/types/performance';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import {
  MOCK_WITHDRAWAL_REQUEST_RESPONSE,
  MOCK_WITHDRAWAL_STATUS_ACTIVE,
  MOCK_WITHDRAWAL_STATUS_DEACTIVATING,
  MOCK_WITHDRAWAL_STATUS_DEACTIVATED,
  MOCK_WITHDRAWAL_STATUS_FEE_NOT_PAID,
  MOCK_FEE_RESPONSE,
  MOCK_FEE_RESPONSE_ZERO,
  MOCK_TRANSACTION_HISTORY_WITH_WITHDRAWALS,
  MOCK_TRANSACTION_HISTORY_ONLY_WITHDRAWALS,
  MOCK_TRANSACTION_HISTORY_NO_WITHDRAWALS,
  MOCK_TRANSACTION_HISTORY_EMPTY,
  MOCK_WITHDRAW_TRANSACTION_1,
  MOCK_WITHDRAW_TRANSACTION_2,
} from '../../fixtures/withdrawal';

describe('WithdrawalModule', () => {
  let module: WithdrawalModule;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockConfig: ResolvedGizaAgentConfig;

  beforeEach(() => {
    // Mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      setHeaders: jest.fn(),
    } as any;

    // Mock config
    mockConfig = {
      partnerApiKey: 'test-api-key',
      backendUrl: 'https://api.test.giza.example',
      chainId: Chain.BASE,
      agentId: 'arma-dev',
      timeout: 45000,
      enableRetry: false,
    };

    module = new WithdrawalModule(mockHttpClient, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should request withdrawal with default transfer=true', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

      const result = await module.request({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}:deactivate?transfer=true`
      );

      expect(result).toEqual(MOCK_WITHDRAWAL_REQUEST_RESPONSE);
    });

    it('should request withdrawal with transfer=true explicitly', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

      const result = await module.request({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        transfer: true,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining('transfer=true')
      );

      expect(result).toEqual(MOCK_WITHDRAWAL_REQUEST_RESPONSE);
    });

    it('should request withdrawal with transfer=false', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

      const result = await module.request({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        transfer: false,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining('transfer=false')
      );

      expect(result).toEqual(MOCK_WITHDRAWAL_REQUEST_RESPONSE);
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new WithdrawalModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.request({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.request({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.request({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('wallet address is required');
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.request({
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.request({
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow('must be a valid Ethereum address');
    });

    it('should accept address with lowercase hex', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

      const lowerCaseAddress = VALID_ADDRESSES.SMART_ACCOUNT_1.toLowerCase() as any;
      await expect(
        module.request({ wallet: lowerCaseAddress })
      ).resolves.toBeDefined();
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(
        module.request({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('Network error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.request({ wallet: INVALID_ADDRESSES.TOO_SHORT as any })
      ).rejects.toThrow();

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should get status for wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_ACTIVE);

      const result = await module.getStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`
      );

      expect(result).toEqual(MOCK_WITHDRAWAL_STATUS_ACTIVE);
    });

    it('should handle origin_wallet parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_ACTIVE);

      await module.getStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}?eoa=${VALID_ADDRESSES.EOA_1}`
      );
    });

    it('should return DEACTIVATING status', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_DEACTIVATING);

      const result = await module.getStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe(AgentStatus.DEACTIVATING);
    });

    it('should return DEACTIVATED status', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      const result = await module.getStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
      expect(result.last_deactivation_date).toBe('2024-03-01T00:00:00Z');
    });

    it('should return DEACTIVATED_FEE_NOT_PAID status', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_FEE_NOT_PAID);

      const result = await module.getStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe(AgentStatus.DEACTIVATED_FEE_NOT_PAID);
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_ACTIVE);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new WithdrawalModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getStatus({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getStatus({
          wallet: INVALID_ADDRESSES.MISSING_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('API error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getStatus({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('API error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getStatus({ wallet: INVALID_ADDRESSES.TOO_LONG as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should fetch and filter withdrawal transactions', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_WITH_WITHDRAWALS);

      const result = await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions?page=1&limit=20`
      );

      // Should filter to only withdrawal transactions
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toEqual(MOCK_WITHDRAW_TRANSACTION_1);
      expect(result.transactions[1]).toEqual(MOCK_WITHDRAW_TRANSACTION_2);
      expect(result.transactions.every((tx) => tx.action === TxAction.WITHDRAW)).toBe(true);
    });

    it('should handle history with only withdrawals', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_ONLY_WITHDRAWALS);

      const result = await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions.every((tx) => tx.action === TxAction.WITHDRAW)).toBe(true);
    });

    it('should return empty array when no withdrawals', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_NO_WITHDRAWALS);

      const result = await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.transactions).toHaveLength(0);
    });

    it('should handle empty transaction history', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_EMPTY);

      const result = await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.total_items).toBe(0);
    });

    it('should respect custom page and limit', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_ONLY_WITHDRAWALS);

      await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        page: 2,
        limit: 50,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2&limit=50')
      );
    });

    it('should enforce max limit of 100', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_ONLY_WITHDRAWALS);

      await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        limit: 200,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=100')
      );
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_ONLY_WITHDRAWALS);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new WithdrawalModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getHistory({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getHistory({
          wallet: INVALID_ADDRESSES.WRONG_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('History fetch error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getHistory({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('History fetch error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getHistory({ wallet: INVALID_ADDRESSES.ONLY_PREFIX as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should update pagination to reflect filtered results', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_WITH_WITHDRAWALS);

      const result = await module.getHistory({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        limit: 20,
      });

      // Original had 4 items, but only 2 are withdrawals
      expect(result.pagination.total_items).toBe(2);
      expect(result.pagination.total_pages).toBe(1);
    });
  });

  describe('getFees', () => {
    it('should fetch fees for wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_FEE_RESPONSE);

      const result = await module.getFees({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/fee`
      );

      expect(result).toEqual(MOCK_FEE_RESPONSE);
      expect(result.percentage_fee).toBe(0.1);
      expect(result.fee).toBe(100.5);
    });

    it('should handle zero fees', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_FEE_RESPONSE_ZERO);

      const result = await module.getFees({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.percentage_fee).toBe(0.0);
      expect(result.fee).toBe(0.0);
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_FEE_RESPONSE);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new WithdrawalModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getFees({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getFees({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getFees({
          wallet: INVALID_ADDRESSES.WITH_SPACES as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('Fee fetch error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getFees({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('Fee fetch error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getFees({ wallet: INVALID_ADDRESSES.UPPERCASE_X as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('pollStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should poll until status is DEACTIVATED', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATING)
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATING)
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      const promise = module.pollStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      // Fast-forward through first poll
      await jest.advanceTimersByTimeAsync(5000);
      // Fast-forward through second poll
      await jest.advanceTimersByTimeAsync(5000);

      const result = await promise;

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should return immediately if already DEACTIVATED', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      const result = await module.pollStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should use custom interval', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATING)
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      const promise = module.pollStatus(
        { wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 },
        { interval: 3000 }
      );

      // Fast-forward with custom interval
      await jest.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
    });

    it('should call onUpdate callback on each poll', async () => {
      const onUpdate = jest.fn();
      mockHttpClient.get
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_ACTIVE)
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATING)
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      const promise = module.pollStatus(
        { wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 },
        { onUpdate, interval: 1000 }
      );

      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(1000);

      await promise;

      expect(onUpdate).toHaveBeenCalledTimes(3);
      expect(onUpdate).toHaveBeenNthCalledWith(1, AgentStatus.ACTIVE);
      expect(onUpdate).toHaveBeenNthCalledWith(2, AgentStatus.DEACTIVATING);
      expect(onUpdate).toHaveBeenNthCalledWith(3, AgentStatus.DEACTIVATED);
    });

    it('should handle origin_wallet parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      await module.pollStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`eoa=${VALID_ADDRESSES.EOA_1}`)
      );
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.pollStatus({
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.pollStatus({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('Network error');
    });

    it('should use default interval and timeout', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATING)
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_DEACTIVATED);

      const promise = module.pollStatus({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      // Default interval is 5000ms
      await jest.advanceTimersByTimeAsync(5000);

      const result = await promise;

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
    });
  });

  describe('address validation edge cases', () => {
    it('should accept all valid test addresses for request', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

      for (const address of Object.values(VALID_ADDRESSES)) {
        await expect(module.request({ wallet: address })).resolves.toBeDefined();
      }
    });

    it('should reject all invalid test addresses for request', async () => {
      for (const address of Object.values(INVALID_ADDRESSES)) {
        if (address !== INVALID_ADDRESSES.EMPTY) {
          await expect(
            module.request({ wallet: address as any })
          ).rejects.toThrow(ValidationError);
        }
      }
    });

    it('should handle checksum addresses', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_WITHDRAWAL_STATUS_ACTIVE);

      const checksumAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as any;
      await expect(module.getStatus({ wallet: checksumAddress })).resolves.toBeDefined();
    });
  });

  describe('HTTP client integration', () => {
    it('should not make duplicate calls for different methods', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);
      mockHttpClient.get
        .mockResolvedValueOnce(MOCK_WITHDRAWAL_STATUS_ACTIVE)
        .mockResolvedValueOnce(MOCK_TRANSACTION_HISTORY_EMPTY)
        .mockResolvedValueOnce(MOCK_FEE_RESPONSE);

      await module.request({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(0);

      await module.getStatus({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      await module.getHistory({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);

      await module.getFees({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
    });
  });
});

