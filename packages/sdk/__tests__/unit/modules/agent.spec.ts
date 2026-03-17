import { Agent } from '../../../src/agent';
import { HttpClient } from '../../../src/http/client';
import { Chain, ValidationError } from '../../../src/types/common';
import { ResolvedGizaConfig } from '../../../src/types/config';
import { AgentStatus } from '../../../src/types/agent';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import {
  MOCK_PERFORMANCE_CHART_RESPONSE,
  MOCK_AGENT_INFO,
  MOCK_APR_RESPONSE,
} from '../../fixtures/performance';
import {
  MOCK_WITHDRAWAL_REQUEST_RESPONSE,
  MOCK_FEE_RESPONSE,
} from '../../fixtures/withdrawal';

describe('Agent', () => {
  let agent: Agent;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockConfig: ResolvedGizaConfig;

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
      apiKey: 'test-api-key',
      partner: 'test-partner',
      apiUrl: 'https://api.test.giza.example',
      chain: Chain.BASE,
      agentId: 'giza-app',
      timeout: 45000,
      enableRetry: false,
    };

    agent = new Agent(mockHttpClient, mockConfig, VALID_ADDRESSES.SMART_ACCOUNT_1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Constructor
  // ============================================================================

  describe('constructor', () => {
    it('should create agent with valid wallet', () => {
      expect(agent.wallet).toBe(VALID_ADDRESSES.SMART_ACCOUNT_1);
    });

    it('should throw ValidationError for invalid wallet', () => {
      expect(() => new Agent(
        mockHttpClient, mockConfig, INVALID_ADDRESSES.INVALID_CHARS as any
      )).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty wallet', () => {
      expect(() => new Agent(
        mockHttpClient, mockConfig, INVALID_ADDRESSES.EMPTY as any
      )).toThrow('wallet address is required');
    });
  });

  // ============================================================================
  // Activation Tests
  // ============================================================================

  describe('activate', () => {
    it('should activate agent with valid options', async () => {
      const mockResponse = { message: 'Agent starting activation', wallet: VALID_ADDRESSES.SMART_ACCOUNT_1 };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await agent.activate({
        owner: VALID_ADDRESSES.EOA_1,
        token: VALID_ADDRESSES.EOA_2,
        protocols: ['aave', 'compound'],
        txHash: '0x1234',
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets`,
        expect.objectContaining({
          wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
          eoa: VALID_ADDRESSES.EOA_1,
          initial_token: VALID_ADDRESSES.EOA_2,
          selected_protocols: ['aave', 'compound'],
        }),
      );
      expect(result.message).toBe('Agent starting activation');
    });

    it('should throw ValidationError for empty protocols', async () => {
      await expect(
        agent.activate({
          owner: VALID_ADDRESSES.EOA_1,
          token: VALID_ADDRESSES.EOA_2,
          protocols: [],
          txHash: '0x1234',
        })
      ).rejects.toThrow('At least one protocol must be selected');
    });

    it('should throw ValidationError for invalid owner', async () => {
      await expect(
        agent.activate({
          owner: INVALID_ADDRESSES.INVALID_CHARS as any,
          token: VALID_ADDRESSES.EOA_2,
          protocols: ['aave'],
          txHash: '0x1234',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deactivate', () => {
    it('should deactivate with transfer=true by default', async () => {
      mockHttpClient.post.mockResolvedValue({ message: 'Wallet deactivation initiated' });

      await agent.deactivate();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':deactivate?transfer=true')
      );
    });

    it('should deactivate with transfer=false', async () => {
      mockHttpClient.post.mockResolvedValue({ message: 'Wallet deactivation initiated' });

      await agent.deactivate({ transfer: false });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':deactivate?transfer=false')
      );
    });
  });

  describe('topUp', () => {
    it('should top up agent', async () => {
      mockHttpClient.post.mockResolvedValue({ message: 'Top-up process started' });

      const validTxHash = '0x' + 'ab'.repeat(32);
      await agent.topUp(validTxHash);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(`:top-up?tx_hash=${validTxHash}`)
      );
    });

    it('should throw ValidationError for missing tx_hash', async () => {
      await expect(agent.topUp('')).rejects.toThrow('Transaction hash is required');
    });
  });

  describe('run', () => {
    it('should run agent', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 'success' });

      const result = await agent.run();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}:run`
      );
      expect(result.status).toBe('success');
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('performance', () => {
    it('should get performance data', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      const result = await agent.performance();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/performance`
      );
      expect(result.performance).toHaveLength(2);
    });

    it('should include from_date in query', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_PERFORMANCE_CHART_RESPONSE);

      await agent.performance({ from: '2024-01-01' });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('from_date=2024-01-01')
      );
    });
  });

  describe('portfolio', () => {
    it('should get portfolio data', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_AGENT_INFO);

      const result = await agent.portfolio();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}`
      );
      expect(result.status).toBe(AgentStatus.ACTIVATED);
    });
  });

  describe('apr', () => {
    it('should get APR data', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      const result = await agent.apr();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/apr`
      );
      expect(result.apr).toBe(12.5);
    });

    it('should include date params in query', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_APR_RESPONSE);

      await agent.apr({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        useExactEndDate: true,
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
  // Paginated Collection Tests
  // ============================================================================

  describe('transactions', () => {
    it('should return a Paginator', () => {
      const paginator = agent.transactions();
      expect(paginator).toBeDefined();
      expect(typeof paginator.first).toBe('function');
      expect(typeof paginator.page).toBe('function');
    });

    it('should fetch first page via .first()', async () => {
      mockHttpClient.get.mockResolvedValue({
        transactions: [
          { action: 'deposit', date: '2024-01-01', amount: 100, token_type: 'USDC', status: 'approved' },
        ],
        pagination: { page: 1, items_per_page: 20, total_pages: 1, total_items: 1 },
      });

      const txs = await agent.transactions().first();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions')
      );
      expect(txs).toHaveLength(1);
    });
  });

  // ============================================================================
  // Withdrawal Tests
  // ============================================================================

  describe('withdraw', () => {
    it('should call deactivate endpoint when no amount given', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_WITHDRAWAL_REQUEST_RESPONSE);

      await agent.withdraw();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':deactivate?transfer=true')
      );
    });

    it('should call withdraw endpoint with amount', async () => {
      const mockPartialResponse = {
        date: '2024-03-01T00:00:00Z',
        amount: 1000,
        value: 1000,
        withdraw_details: [
          { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: '1000000000', value: 1000, value_in_usd: 1000 },
        ],
      };
      mockHttpClient.post.mockResolvedValue(mockPartialResponse);

      const result = await agent.withdraw('1000000000');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining(':withdraw'),
        { amount: 1000000000 }
      );
      expect((result as any).amount).toBe(1000);
    });
  });

  describe('withdraw validation', () => {
    it('should reject NaN amount', async () => {
      await expect(agent.withdraw('abc')).rejects.toThrow(ValidationError);
    });

    it('should reject negative amount', async () => {
      await expect(agent.withdraw('-100')).rejects.toThrow('positive integer');
    });

    it('should reject decimal amount', async () => {
      await expect(agent.withdraw('10.5')).rejects.toThrow(ValidationError);
    });

    it('should reject zero amount', async () => {
      await expect(agent.withdraw('0')).rejects.toThrow('positive integer');
    });
  });

  describe('topUp validation', () => {
    it('should reject invalid tx hash format', async () => {
      await expect(agent.topUp('0x123')).rejects.toThrow(
        'valid transaction hash',
      );
    });

    it('should reject tx hash without 0x prefix', async () => {
      await expect(agent.topUp('abcd'.repeat(16))).rejects.toThrow(
        'valid transaction hash',
      );
    });
  });

  describe('executionLogs', () => {
    it('should reject path traversal IDs', () => {
      expect(() =>
        agent.executionLogs('../../../etc/passwd'),
      ).toThrow('invalid characters');
    });

    it('should reject IDs with slashes', () => {
      expect(() =>
        agent.executionLogs('../../secret'),
      ).toThrow('invalid characters');
    });

    it('should accept valid execution IDs', () => {
      mockHttpClient.get.mockResolvedValue({ items: [], total: 0 });
      expect(() => agent.executionLogs('exec-123_abc')).not.toThrow();
    });
  });

  describe('status', () => {
    it('should get withdrawal status', async () => {
      mockHttpClient.get.mockResolvedValue({
        wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
        status: AgentStatus.DEACTIVATED,
        activation_date: '2024-01-01T00:00:00Z',
        last_deactivation_date: '2024-03-01T00:00:00Z',
      });

      const result = await agent.status();

      expect(result.status).toBe(AgentStatus.DEACTIVATED);
    });
  });

  // ============================================================================
  // Fee & Limit Tests
  // ============================================================================

  describe('fees', () => {
    it('should get fee information', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_FEE_RESPONSE);

      const result = await agent.fees();

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/fee`
      );
      expect(result.percentage_fee).toBe(0.1);
      expect(result.fee).toBe(100.5);
    });
  });

  describe('limit', () => {
    it('should get deposit limit', async () => {
      mockHttpClient.get.mockResolvedValue({ limit: 10000 });

      const result = await agent.limit(VALID_ADDRESSES.EOA_1);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`eoa=${VALID_ADDRESSES.EOA_1}`)
      );
      expect(result.limit).toBe(10000);
    });
  });

  // ============================================================================
  // Protocol Tests (wallet-scoped)
  // ============================================================================

  describe('updateProtocols', () => {
    it('should update protocols', async () => {
      mockHttpClient.put.mockResolvedValue(undefined);

      await agent.updateProtocols(['aave', 'compound']);

      expect(mockHttpClient.put).toHaveBeenCalledWith(
        `/api/v1/${Chain.BASE}/wallets/${VALID_ADDRESSES.SMART_ACCOUNT_1}/protocols`,
        ['aave', 'compound']
      );
    });

    it('should throw ValidationError for empty protocols', async () => {
      await expect(agent.updateProtocols([])).rejects.toThrow(
        'At least one protocol must be provided'
      );
    });
  });

  // ============================================================================
  // HTTP Error Propagation Tests
  // ============================================================================

  describe('HTTP error propagation', () => {
    it('should propagate HTTP errors from POST requests', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(
        agent.activate({
          owner: VALID_ADDRESSES.EOA_1,
          token: VALID_ADDRESSES.EOA_2,
          protocols: ['aave'],
          txHash: '0x1234',
        })
      ).rejects.toThrow('Network error');
    });

    it('should propagate HTTP errors from GET requests', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API error'));

      await expect(agent.performance()).rejects.toThrow('API error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        agent.activate({
          owner: INVALID_ADDRESSES.INVALID_CHARS as any,
          token: VALID_ADDRESSES.EOA_2,
          protocols: ['aave'],
          txHash: '0x1234',
        })
      ).rejects.toThrow();

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});
