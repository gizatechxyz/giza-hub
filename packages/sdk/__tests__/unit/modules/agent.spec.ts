import { AgentModule } from '../../../src/modules/agent.module';
import { HttpClient } from '../../../src/http/client';
import { Chain, ValidationError, NotImplementedError } from '../../../src/types/common';
import { ResolvedGizaAgentConfig } from '../../../src/types/config';
import { AgentStatus } from '../../../src/types/agent';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import { MOCK_SMART_ACCOUNT_RESPONSE_1 } from '../../fixtures/accounts';
import {
  MOCK_PERFORMANCE_CHART_RESPONSE,
  MOCK_AGENT_INFO,
  MOCK_TRANSACTION_HISTORY_PAGE_1,
  MOCK_APR_RESPONSE,
} from '../../fixtures/performance';
import {
  MOCK_WITHDRAWAL_REQUEST_RESPONSE,
  MOCK_WITHDRAWAL_STATUS_DEACTIVATED,
  MOCK_FEE_RESPONSE,
  MOCK_TRANSACTION_HISTORY_WITH_WITHDRAWALS,
} from '../../fixtures/withdrawal';

describe('AgentModule', () => {
  let module: AgentModule;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockConfig: ResolvedGizaAgentConfig;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      setHeaders: jest.fn(),
    } as any;

    mockConfig = {
      partnerApiKey: 'test-api-key',
      backendUrl: 'https://api.test.giza.example',
      chainId: Chain.BASE,
      agentId: 'giza-app',
      timeout: 45000,
      enableRetry: false,
    };

    module = new AgentModule(mockHttpClient, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Smart Account Tests
  // ============================================================================

  describe('createSmartAccount', () => {
    it('should create smart account with valid address', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await module.createSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/proxy/zerodev/smart-accounts',
        {
          eoa: VALID_ADDRESSES.EOA_1,
          chain: Chain.BASE,
          agent_id: 'giza-app',
        }
      );

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });
    });

    it('should throw ValidationError for invalid address', async () => {
      await expect(
        module.createSmartAccount({
          origin_wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty address', async () => {
      await expect(
        module.createSmartAccount({
          origin_wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('origin wallet address is required');
    });
  });

  describe('getSmartAccount', () => {
    it('should get smart account with origin wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await module.getSmartAccount({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/proxy/zerodev/smart-accounts')
      );
      expect(result.origin_wallet).toBe(VALID_ADDRESSES.EOA_1);
    });

    it('should throw NotImplementedError with only smartAccount', async () => {
      await expect(
        module.getSmartAccount({
          smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(NotImplementedError);
    });

    it('should throw ValidationError with no parameters', async () => {
      await expect(module.getSmartAccount({})).rejects.toThrow(ValidationError);
    });
  });

  // ============================================================================
  // Protocol Tests
  // ============================================================================

  describe('getProtocols', () => {
    it('should get protocols for token', async () => {
      const mockResponse = {
        protocols: [
          { name: 'aave', available: true, description: 'Aave protocol', tvl: 1000, apy: 5.0 },
          { name: 'compound', available: true, description: 'Compound protocol', tvl: 2000, apy: 4.5 },
          { name: 'morpho', available: true, description: 'Morpho protocol', tvl: 500, apy: 6.0 },
        ],
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await module.getProtocols(VALID_ADDRESSES.EOA_1);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/${VALID_ADDRESSES.EOA_1}/protocols`
      );
      expect(result.protocols).toEqual(['aave', 'compound', 'morpho']);
    });

    it('should throw ValidationError for invalid token address', async () => {
      await expect(
        module.getProtocols(INVALID_ADDRESSES.INVALID_CHARS as any)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateProtocols', () => {
    it('should update protocols', async () => {
      mockHttpClient.put.mockResolvedValue(undefined);

      await module.updateProtocols(
        VALID_ADDRESSES.SMART_ACCOUNT_1,
        ['aave', 'compound']
      );

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/protocols`,
        ['aave', 'compound']
      );
    });

    it('should throw ValidationError for empty protocols', async () => {
      await expect(
        module.updateProtocols(VALID_ADDRESSES.SMART_ACCOUNT_1, [])
      ).rejects.toThrow('At least one protocol must be provided');
    });
  });

  // ============================================================================
  // Activation Tests
  // ============================================================================

  describe('activate', () => {
    it('should activate agent with valid params', async () => {
      const mockResponse = { message: 'Agent starting activation', wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await module.activate({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        initial_token: VALID_ADDRESSES.EOA_2,
        selected_protocols: ['aave', 'compound'],
        tx_hash: '0x1234',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets`,
        expect.objectContaining({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          eoa: VALID_ADDRESSES.EOA_1,
          initial_token: VALID_ADDRESSES.EOA_2,
          selected_protocols: ['aave', 'compound'],
        })
      );
      expect(result.message).toBe('Agent starting activation');
    });

    it('should throw ValidationError for empty protocols', async () => {
      await expect(
        module.activate({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          origin_wallet: VALID_ADDRESSES.EOA_1,
          initial_token: VALID_ADDRESSES.EOA_2,
          selected_protocols: [],
        })
      ).rejects.toThrow('At least one protocol must be selected');
    });

    it('should throw ValidationError for invalid wallet', async () => {
      await expect(
        module.activate({
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
          origin_wallet: VALID_ADDRESSES.EOA_1,
          initial_token: VALID_ADDRESSES.EOA_2,
          selected_protocols: ['aave'],
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deactivate', () => {
    it('should deactivate agent with transfer=true by default', async () => {
      mockHttpClient.post.mockResolvedValue({ message: 'Wallet deactivation initiated' });

      await module.deactivate({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':deactivate?transfer=true')
      );
    });

    it('should deactivate agent with transfer=false', async () => {
      mockHttpClient.post.mockResolvedValue({ message: 'Wallet deactivation initiated' });

      await module.deactivate({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        transfer: false,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':deactivate?transfer=false')
      );
    });
  });

  describe('topUp', () => {
    it('should top up agent', async () => {
      mockHttpClient.post.mockResolvedValue({ message: 'Top-up process started' });

      await module.topUp({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        tx_hash: '0x1234567890',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':top-up?tx_hash=0x1234567890')
      );
    });

    it('should throw ValidationError for missing tx_hash', async () => {
      await expect(
        module.topUp({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          tx_hash: '',
        })
      ).rejects.toThrow('Transaction hash is required');
    });
  });

  describe('run', () => {
    it('should run agent', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 'success' });

      const result = await module.run({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}:run`
      );
      expect(result.status).toBe('success');
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('getPerformance', () => {
    it('should get performance data', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await module.getPerformance({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
      );
      expect(result.performance).toHaveLength(2);
    });

    it('should include from_date in query', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      await module.getPerformance({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        from_date: '2024-01-01',
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('from_date=2024-01-01')
      );
    });
  });

  describe('getPortfolio', () => {
    it('should get portfolio data', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);

      const result = await module.getPortfolio({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`
      );
      expect(result.status).toBe(AgentStatus.ACTIVE);
    });
  });

  describe('getAPR', () => {
    it('should get APR data', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      const result = await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`
      );
      expect(result.apr).toBe(12.5);
    });

    it('should include date params in query', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await module.getAPR({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        use_exact_end_date: true,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2024-01-01')
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2024-12-31')
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('use_exact_end_date=true')
      );
    });
  });

  // ============================================================================
  // Transaction History Tests
  // ============================================================================

  describe('getTransactions', () => {
    it('should get transaction history', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      const result = await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions')
      );
      expect(result.transactions).toHaveLength(3);
    });

    it('should respect pagination params', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        page: 2,
        limit: 50,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
    });

    it('should cap limit at 100', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_PAGE_1);

      await module.getTransactions({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        limit: 200,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=100')
      );
    });
  });

  describe('getWithdrawalHistory', () => {
    it('should filter for withdrawal transactions only', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_TRANSACTION_HISTORY_WITH_WITHDRAWALS);

      const result = await module.getWithdrawalHistory(VALID_ADDRESSES.SMART_ACCOUNT_1);

      // Original has 4 transactions, but only 2 are withdrawals
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions.every(tx => tx.action === 'WITHDRAW')).toBe(true);
    });
  });

  // ============================================================================
  // Withdrawal Tests
  // ============================================================================

  describe('withdraw', () => {
    describe('full withdrawal (no amount specified)', () => {
      it('should call deactivate endpoint with transfer=true by default', async () => {
        mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

        const result = await module.withdraw({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining(':deactivate?transfer=true')
        );
        expect((result as any).message).toBe('Wallet deactivation initiated');
      });

      it('should call deactivate endpoint with transfer=false when specified', async () => {
        mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

        await module.withdraw({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          transfer: false,
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining(':deactivate?transfer=false')
        );
      });
    });

    describe('partial withdrawal (amount specified)', () => {
      it('should call withdraw endpoint with amount in body', async () => {
        const mockPartialResponse = {
          date: '2024-03-01T00:00:00Z',
          total_value: 1000,
          total_value_in_usd: 1000,
          withdraw_details: [
            { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: 1000000000, value: 1000, value_in_usd: 1000 }
          ],
        };
        mockHttpClient.post.mockResolvedValue(mockPartialResponse);

        const result = await module.withdraw({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          amount: '1000000000',
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining(':withdraw'),
          { amount: 1000000000 }
        );
        expect((result as any).total_value).toBe(1000);
        expect((result as any).withdraw_details).toHaveLength(1);
      });

      it('should convert string amount to integer', async () => {
        const mockPartialResponse = {
          date: '2024-03-01T00:00:00Z',
          total_value: 500,
          total_value_in_usd: 500,
          withdraw_details: [],
        };
        mockHttpClient.post.mockResolvedValue(mockPartialResponse);

        await module.withdraw({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          amount: '500000000',
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining(':withdraw'),
          { amount: 500000000 }
        );
      });
    });

    it('should throw ValidationError for invalid wallet address', async () => {
      await expect(
        module.withdraw({
          wallet: 'invalid-address' as any,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getWithdrawalStatus', () => {
    it('should get withdrawal status', async () => {
      mockHttpClient.get.mockResolvedValue({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        status: AgentStatus.DEACTIVATED,
        activation_date: '2024-01-01T00:00:00Z',
        last_deactivation_date: '2024-03-01T00:00:00Z',
      });

      const result = await module.getWithdrawalStatus(VALID_ADDRESSES.SMART_ACCOUNT_1);

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
    });
  });

  describe('getFees', () => {
    it('should get fee information', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_FEE_RESPONSE);

      const result = await module.getFees(VALID_ADDRESSES.SMART_ACCOUNT_1);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/fee`
      );
      expect(result.percentage_fee).toBe(0.1);
      expect(result.fee).toBe(100.5);
    });
  });

  // ============================================================================
  // Limit Tests
  // ============================================================================

  describe('getLimit', () => {
    it('should get deposit limit', async () => {
      mockHttpClient.get.mockResolvedValue({ limit: 10000 });

      const result = await module.getLimit({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`eoa=${VALID_ADDRESSES.EOA_1}`)
      );
      expect(result.limit).toBe(10000);
    });
  });

  // ============================================================================
  // Rewards Tests
  // ============================================================================

  describe('claimRewards', () => {
    it('should claim rewards', async () => {
      const mockRewards = {
        rewards: [
          { token: '0x1234', amount: 1000, amount_float: 0.001, current_price_in_underlying: 1.5 }
        ]
      };
      mockHttpClient.post.mockResolvedValue(mockRewards);

      const result = await module.claimRewards(VALID_ADDRESSES.SMART_ACCOUNT_1);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}:claim-rewards`
      );
      expect(result.rewards).toHaveLength(1);
    });
  });

  // ============================================================================
  // Address Validation Tests
  // ============================================================================

  describe('address validation', () => {
    it('should accept lowercase addresses', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const lowerCaseAddress = VALID_ADDRESSES.EOA_1.toLowerCase() as any;
      await expect(
        module.createSmartAccount({ origin_wallet: lowerCaseAddress })
      ).resolves.toBeDefined();
    });

    it('should accept mixed case addresses', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      await expect(
        module.createSmartAccount({ origin_wallet: VALID_ADDRESSES.EOA_1 })
      ).resolves.toBeDefined();
    });

    it('should reject all invalid addresses', async () => {
      for (const address of Object.values(INVALID_ADDRESSES)) {
        if (address !== INVALID_ADDRESSES.EMPTY) {
          await expect(
            module.createSmartAccount({ origin_wallet: address as any })
          ).rejects.toThrow(ValidationError);
        }
      }
    });
  });

  // ============================================================================
  // HTTP Error Propagation Tests
  // ============================================================================

  describe('HTTP error propagation', () => {
    it('should propagate HTTP errors from POST requests', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(
        module.createSmartAccount({ origin_wallet: VALID_ADDRESSES.EOA_1 })
      ).rejects.toThrow('Network error');
    });

    it('should propagate HTTP errors from GET requests', async () => {
      const error = new Error('API error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getPerformance({ wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 })
      ).rejects.toThrow('API error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.createSmartAccount({ origin_wallet: INVALID_ADDRESSES.INVALID_CHARS as any })
      ).rejects.toThrow();

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});

