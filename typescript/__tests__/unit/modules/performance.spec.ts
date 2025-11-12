import { PerformanceModule } from '../../../src/modules/performance.module';
import { HttpClient } from '../../../src/http/client';
import { Chain, ValidationError } from '../../../src/types/common';
import { ResolvedGizaAgentConfig } from '../../../src/types/config';
import { SortOrder } from '../../../src/types/performance';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import {
  MOCK_PERFORMANCE_CHART_RESPONSE,
  MOCK_AGENT_INFO,
  MOCK_TRANSACTION_HISTORY_PAGE_1,
  MOCK_APR_RESPONSE,
} from '../../fixtures/performance';

describe('PerformanceModule', () => {
  let module: PerformanceModule;
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

    module = new PerformanceModule(mockHttpClient, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChart', () => {
    it('should fetch chart data with valid wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await module.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
      );

      expect(result).toEqual(MOCK_PERFORMANCE_CHART_RESPONSE);
    });

    it('should handle from_date parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      await module.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        from_date: '2024-01-01 00:00:00',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance?from_date=2024-01-01+00%3A00%3A00`
      );
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new PerformanceModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getChart({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getChart({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.getChart({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('wallet address is required');
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getChart({
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.getChart({
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow('must be a valid Ethereum address');
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('Network error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getChart({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('Network error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getChart({ wallet: INVALID_ADDRESSES.TOO_SHORT as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should accept address with lowercase hex', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      const lowerCaseAddress = VALID_ADDRESSES.SMART_ACCOUNT_1.toLowerCase() as any;
      await expect(
        module.getChart({ wallet: lowerCaseAddress })
      ).resolves.toBeDefined();
    });
  });

  describe('getPortfolio', () => {
    it('should fetch portfolio with valid wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);

      const result = await module.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`
      );

      expect(result).toEqual(MOCK_AGENT_INFO);
    });

    it('should handle origin_wallet parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);

      await module.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: true,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}?eoa=true`
      );
    });

    it('should handle origin_wallet false parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);

      await module.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: false,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}?eoa=false`
      );
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new PerformanceModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getPortfolio({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getPortfolio({
          wallet: INVALID_ADDRESSES.MISSING_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('API error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getPortfolio({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('API error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getPortfolio({ wallet: INVALID_ADDRESSES.WRONG_PREFIX as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions with default pagination', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      const result = await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/transactions?page=1&limit=20`
      );

      expect(result).toEqual(MOCK_TRANSACTION_HISTORY_PAGE_1);
    });

    it('should respect custom page and limit', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        page: 2,
        limit: 50,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2&limit=50')
      );
    });

    it('should enforce max limit of 100', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        limit: 200,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=100')
      );
    });

    it('should handle sort parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        sort: SortOrder.DATE_ASC,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=date_asc')
      );
    });

    it('should handle all parameters together', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        page: 3,
        limit: 10,
        sort: SortOrder.DATE_DESC,
      });

      const call = mockHttpClient.get.mock.calls[0][0];
      expect(call).toContain('page=3');
      expect(call).toContain('limit=10');
      expect(call).toContain('sort=date_desc');
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new PerformanceModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getTransactions({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getTransactions({
          wallet: INVALID_ADDRESSES.ONLY_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('Transaction fetch error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getTransactions({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('Transaction fetch error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getTransactions({ wallet: INVALID_ADDRESSES.WITH_SPACES as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getAPR', () => {
    it('should fetch APR with valid wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      const result = await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/agents/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`
      );

      expect(result).toEqual(MOCK_APR_RESPONSE);
    });

    it('should handle start_date parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        start_date: '2024-01-01T00:00:00Z',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2024-01-01T00%3A00%3A00Z')
      );
    });

    it('should handle end_date parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        end_date: '2024-12-31T23:59:59Z',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2024-12-31T23%3A59%3A59Z')
      );
    });

    it('should handle use_exact_end_date parameter', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        use_exact_end_date: true,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('use_exact_end_date=true')
      );
    });

    it('should handle use_exact_end_date false', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        use_exact_end_date: false,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('use_exact_end_date=false')
      );
    });

    it('should handle all date parameters together', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        use_exact_end_date: true,
      });

      const call = mockHttpClient.get.mock.calls[0][0];
      expect(call).toContain('start_date=');
      expect(call).toContain('end_date=');
      expect(call).toContain('use_exact_end_date=true');
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new PerformanceModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/agents/${Chain.ARBITRUM}/wallets/`)
      );
    });

    it('should throw ValidationError for empty wallet', async () => {
      await expect(
        module.getAPR({
          wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.getAPR({
          wallet: INVALID_ADDRESSES.TOO_LONG as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should propagate HTTP errors', async () => {
      const error = new Error('APR calculation error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getAPR({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('APR calculation error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.getAPR({ wallet: INVALID_ADDRESSES.UPPERCASE_X as any })
      ).rejects.toThrow();

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('address validation edge cases', () => {
    it('should accept all valid test addresses for getChart', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      for (const address of Object.values(VALID_ADDRESSES)) {
        await expect(module.getChart({ wallet: address })).resolves.toBeDefined();
      }
    });

    it('should reject all invalid test addresses for getChart', async () => {
      for (const address of Object.values(INVALID_ADDRESSES)) {
        if (address !== INVALID_ADDRESSES.EMPTY) {
          await expect(
            module.getChart({ wallet: address as any })
          ).rejects.toThrow(ValidationError);
        }
      }
    });

    it('should handle checksum addresses', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);

      const checksumAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as any;
      await expect(module.getPortfolio({ wallet: checksumAddress })).resolves.toBeDefined();
    });
  });

  describe('HTTP client integration', () => {
    it('should not make duplicate calls for different methods', async () => {
      mockHttpClient.get.mockResolvedValue({});

      await module.getChart({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

      await module.getPortfolio({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);

      await module.getTransactions({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);

      await module.getAPR({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 });
      expect(mockHttpClient.get).toHaveBeenCalledTimes(4);
    });
  });
});

