import { Giza } from '../../../src/giza';
import { Chain, ValidationError } from '../../../src/types/common';
import { WalletConstraints } from '../../../src/types/optimizer';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import {
  MOCK_OPTIMIZE_RESPONSE,
  SAMPLE_OPTIMIZE_OPTIONS,
} from '../../fixtures/optimizer';
import { setupTestEnv, restoreEnv } from '../../helpers/test-env';

describe('Giza.optimize', () => {
  let giza: Giza;
  let mockPost: jest.Mock;

  beforeEach(() => {
    setupTestEnv();
    giza = new Giza({ chain: Chain.BASE });

    // Mock the internal httpClient.post
    mockPost = jest.fn();
    (giza as any).httpClient.post = mockPost;
  });

  afterEach(() => {
    restoreEnv();
    jest.clearAllMocks();
  });

  // ============================================================================
  // Optimize Tests
  // ============================================================================

  describe('optimize', () => {
    it('should optimize allocations successfully', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const result = await giza.optimize(SAMPLE_OPTIMIZE_OPTIONS);

      expect(mockPost).toHaveBeenCalledWith(
        `/api/v1/optimizer/${Chain.BASE}/optimize`,
        {
          total_capital: SAMPLE_OPTIMIZE_OPTIONS.capital,
          token_address: SAMPLE_OPTIMIZE_OPTIONS.token,
          current_allocations: SAMPLE_OPTIMIZE_OPTIONS.currentAllocations,
          protocols: SAMPLE_OPTIMIZE_OPTIONS.protocols,
          constraints: SAMPLE_OPTIMIZE_OPTIONS.constraints,
          wallet_address: undefined,
        }
      );

      expect(result).toEqual(MOCK_OPTIMIZE_RESPONSE);
      expect(result.optimization_result.apr_improvement).toBe(5.8);
      expect(result.action_plan).toHaveLength(2);
      expect(result.calldata).toHaveLength(3);
    });

    it('should optimize without constraints', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({
        ...SAMPLE_OPTIMIZE_OPTIONS,
        constraints: undefined,
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ constraints: undefined })
      );
    });

    it('should work with different chain IDs', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({
        ...SAMPLE_OPTIMIZE_OPTIONS,
        chain: Chain.ARBITRUM,
      });

      expect(mockPost).toHaveBeenCalledWith(
        `/api/v1/optimizer/${Chain.ARBITRUM}/optimize`,
        expect.any(Object)
      );
    });

    it('should default to client chain when chain omitted', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const { chain: _, ...optsWithoutChain } = SAMPLE_OPTIMIZE_OPTIONS;
      await giza.optimize(optsWithoutChain as any);

      expect(mockPost).toHaveBeenCalledWith(
        `/api/v1/optimizer/${Chain.BASE}/optimize`,
        expect.any(Object)
      );
    });

    // ============================================================================
    // Validation Tests
    // ============================================================================

    it('should throw ValidationError for invalid chain', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, chain: 9999 as Chain })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid token address', async () => {
      await expect(
        giza.optimize({
          ...SAMPLE_OPTIMIZE_OPTIONS,
          token: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty token address', async () => {
      await expect(
        giza.optimize({
          ...SAMPLE_OPTIMIZE_OPTIONS,
          token: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('token address is required');
    });

    it('should throw ValidationError for empty capital', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, capital: '' })
      ).rejects.toThrow('capital is required');
    });

    it('should throw ValidationError for zero capital', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, capital: '0' })
      ).rejects.toThrow('capital must be a positive integer');
    });

    it('should throw ValidationError for negative capital', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, capital: '-1000000' })
      ).rejects.toThrow('capital must be a positive integer');
    });

    it('should throw ValidationError for non-numeric capital', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, capital: 'not-a-number' })
      ).rejects.toThrow('capital must be a valid positive integer string');
    });

    it('should throw ValidationError for float capital', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, capital: '1000.5' })
      ).rejects.toThrow('capital must be a valid positive integer string');
    });

    it('should throw ValidationError for empty protocols array', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, protocols: [] })
      ).rejects.toThrow('At least one protocol must be provided');
    });

    it('should throw ValidationError for missing protocols', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, protocols: undefined as any })
      ).rejects.toThrow('At least one protocol must be provided');
    });

    it('should throw ValidationError for missing currentAllocations', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, currentAllocations: undefined as any })
      ).rejects.toThrow('currentAllocations must be an object');
    });

    it('should throw ValidationError for null currentAllocations', async () => {
      await expect(
        giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, currentAllocations: null as any })
      ).rejects.toThrow('currentAllocations must be an object');
    });

    it('should throw ValidationError for negative allocation amount', async () => {
      await expect(
        giza.optimize({
          ...SAMPLE_OPTIMIZE_OPTIONS,
          currentAllocations: { aave: '-1000000', compound: '500000000' },
        })
      ).rejects.toThrow('must be non-negative');
    });

    it('should throw ValidationError for non-numeric allocation amount', async () => {
      await expect(
        giza.optimize({
          ...SAMPLE_OPTIMIZE_OPTIONS,
          currentAllocations: { aave: 'not-a-number', compound: '500000000' },
        })
      ).rejects.toThrow('must be a valid non-negative integer string');
    });

    it('should accept zero allocation amount', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({
        ...SAMPLE_OPTIMIZE_OPTIONS,
        currentAllocations: { aave: '0', compound: '500000000' },
      });

      expect(mockPost).toHaveBeenCalled();
    });

    it('should accept empty currentAllocations object', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, currentAllocations: {} });

      expect(mockPost).toHaveBeenCalled();
    });

    // ============================================================================
    // Wallet address tests
    // ============================================================================

    it('should include wallet in request body when provided', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({
        ...SAMPLE_OPTIMIZE_OPTIONS,
        wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ wallet_address: VALID_ADDRESSES.EOA_1 })
      );
    });

    it('should throw ValidationError for invalid wallet', async () => {
      await expect(
        giza.optimize({
          ...SAMPLE_OPTIMIZE_OPTIONS,
          wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should work without wallet', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({ ...SAMPLE_OPTIMIZE_OPTIONS, wallet: undefined });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ wallet_address: undefined })
      );
    });

    // ============================================================================
    // Edge Cases
    // ============================================================================

    it('should handle very large numbers', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);
      const large = '999999999999999999999999999999';

      await giza.optimize({
        ...SAMPLE_OPTIMIZE_OPTIONS,
        capital: large,
        currentAllocations: { aave: large },
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          total_capital: large,
          current_allocations: { aave: large },
        })
      );
    });

    it('should handle multiple constraints', async () => {
      mockPost.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await giza.optimize({
        ...SAMPLE_OPTIMIZE_OPTIONS,
        constraints: [
          { kind: WalletConstraints.MIN_PROTOCOLS, params: { min_protocols: 2 } },
          { kind: WalletConstraints.EXCLUDE_PROTOCOL, params: { protocol: 'compound' } },
        ],
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ kind: 'min_protocols' }),
            expect.objectContaining({ kind: 'exclude_protocol' }),
          ]),
        })
      );
    });

    // ============================================================================
    // HTTP Error Handling
    // ============================================================================

    it('should propagate HTTP errors', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(
        giza.optimize(SAMPLE_OPTIMIZE_OPTIONS)
      ).rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      const apiError = { statusCode: 400, message: 'Invalid optimization parameters' };
      mockPost.mockRejectedValue(apiError);

      await expect(
        giza.optimize(SAMPLE_OPTIMIZE_OPTIONS)
      ).rejects.toEqual(apiError);
    });
  });
});
