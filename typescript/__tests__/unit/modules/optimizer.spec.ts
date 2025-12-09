import { OptimizerModule } from '../../../src/modules/optimizer.module';
import { HttpClient } from '../../../src/http/client';
import { Chain, ValidationError } from '../../../src/types/common';
import { ResolvedGizaAgentConfig } from '../../../src/types/config';
import { WalletConstraints } from '../../../src/types/optimizer';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import {
  MOCK_OPTIMIZE_RESPONSE,
  SAMPLE_OPTIMIZE_PARAMS,
} from '../../fixtures/optimizer';

describe('OptimizerModule', () => {
  let module: OptimizerModule;
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
      partnerName: 'test-partner',
      backendUrl: 'https://api.test.giza.example',
      chainId: Chain.BASE,
      agentId: 'giza-app',
      timeout: 45000,
      enableRetry: false,
    };

    module = new OptimizerModule(mockHttpClient, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Optimize Tests
  // ============================================================================

  describe('optimize', () => {
    it('should optimize allocations successfully', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const result = await module.optimize(SAMPLE_OPTIMIZE_PARAMS);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/optimizer/${SAMPLE_OPTIMIZE_PARAMS.chainId}/optimize`,
        {
          total_capital: SAMPLE_OPTIMIZE_PARAMS.total_capital,
          token_address: SAMPLE_OPTIMIZE_PARAMS.token_address,
          current_allocations: SAMPLE_OPTIMIZE_PARAMS.current_allocations,
          protocols: SAMPLE_OPTIMIZE_PARAMS.protocols,
          constraints: SAMPLE_OPTIMIZE_PARAMS.constraints,
        }
      );

      expect(result).toEqual(MOCK_OPTIMIZE_RESPONSE);
      expect(result.optimization_result.apr_improvement).toBe(5.8);
      expect(result.action_plan).toHaveLength(2);
      expect(result.calldata).toHaveLength(3);
    });

    it('should optimize without constraints', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const paramsWithoutConstraints = {
        ...SAMPLE_OPTIMIZE_PARAMS,
        constraints: undefined,
      };

      await module.optimize(paramsWithoutConstraints);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/optimizer/${paramsWithoutConstraints.chainId}/optimize`,
        expect.objectContaining({
          constraints: undefined,
        })
      );
    });

    it('should optimize with empty constraints array', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const paramsWithEmptyConstraints = {
        ...SAMPLE_OPTIMIZE_PARAMS,
        constraints: [],
      };

      await module.optimize(paramsWithEmptyConstraints);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/optimizer/${paramsWithEmptyConstraints.chainId}/optimize`,
        expect.objectContaining({
          constraints: [],
        })
      );
    });

    it('should work with different chain IDs', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const arbitrumParams = {
        ...SAMPLE_OPTIMIZE_PARAMS,
        chainId: Chain.ARBITRUM,
      };

      await module.optimize(arbitrumParams);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/api/v1/optimizer/${Chain.ARBITRUM}/optimize`,
        expect.any(Object)
      );
    });

    // ============================================================================
    // Validation Tests - Chain ID
    // ============================================================================

    it('should throw ValidationError for invalid chainId', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          chainId: 9999 as Chain,
        })
      ).rejects.toThrow(ValidationError);
    });

    // ============================================================================
    // Validation Tests - Token Address
    // ============================================================================

    it('should throw ValidationError for invalid token address', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          token_address: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty token address', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          token_address: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('token address is required');
    });

    it('should throw ValidationError for missing token address', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          token_address: undefined as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    // ============================================================================
    // Validation Tests - Total Capital
    // ============================================================================

    it('should throw ValidationError for empty total_capital', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          total_capital: '',
        })
      ).rejects.toThrow('total_capital is required');
    });

    it('should throw ValidationError for zero total_capital', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          total_capital: '0',
        })
      ).rejects.toThrow('total_capital must be a positive integer');
    });

    it('should throw ValidationError for negative total_capital', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          total_capital: '-1000000',
        })
      ).rejects.toThrow('total_capital must be a positive integer');
    });

    it('should throw ValidationError for non-numeric total_capital', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          total_capital: 'not-a-number',
        })
      ).rejects.toThrow('total_capital must be a valid positive integer string');
    });

    it('should throw ValidationError for float total_capital', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          total_capital: '1000.5',
        })
      ).rejects.toThrow('total_capital must be a valid positive integer string');
    });

    // ============================================================================
    // Validation Tests - Protocols
    // ============================================================================

    it('should throw ValidationError for empty protocols array', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          protocols: [],
        })
      ).rejects.toThrow('At least one protocol must be provided');
    });

    it('should throw ValidationError for missing protocols', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          protocols: undefined as any,
        })
      ).rejects.toThrow('At least one protocol must be provided');
    });

    // ============================================================================
    // Validation Tests - Current Allocations
    // ============================================================================

    it('should throw ValidationError for missing current_allocations', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          current_allocations: undefined as any,
        })
      ).rejects.toThrow('current_allocations must be an object');
    });

    it('should throw ValidationError for null current_allocations', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          current_allocations: null as any,
        })
      ).rejects.toThrow('current_allocations must be an object');
    });

    it('should throw ValidationError for negative allocation amount', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          current_allocations: {
            aave: '-1000000',
            compound: '500000000',
          },
        })
      ).rejects.toThrow('must be non-negative');
    });

    it('should throw ValidationError for non-numeric allocation amount', async () => {
      await expect(
        module.optimize({
          ...SAMPLE_OPTIMIZE_PARAMS,
          current_allocations: {
            aave: 'not-a-number',
            compound: '500000000',
          },
        })
      ).rejects.toThrow('must be a valid non-negative integer string');
    });

    it('should accept zero allocation amount', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await module.optimize({
        ...SAMPLE_OPTIMIZE_PARAMS,
        current_allocations: {
          aave: '0',
          compound: '500000000',
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should accept empty current_allocations object', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await module.optimize({
        ...SAMPLE_OPTIMIZE_PARAMS,
        current_allocations: {},
      });

      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    // ============================================================================
    // Edge Cases
    // ============================================================================

    it('should handle very large numbers', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      const largeNumber = '999999999999999999999999999999';
      await module.optimize({
        ...SAMPLE_OPTIMIZE_PARAMS,
        total_capital: largeNumber,
        current_allocations: {
          aave: largeNumber,
        },
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          total_capital: largeNumber,
          current_allocations: {
            aave: largeNumber,
          },
        })
      );
    });

    it('should handle single protocol', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await module.optimize({
        ...SAMPLE_OPTIMIZE_PARAMS,
        protocols: ['aave'],
      });

      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should handle many protocols', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await module.optimize({
        ...SAMPLE_OPTIMIZE_PARAMS,
        protocols: ['aave', 'compound', 'moonwell', 'fluid', 'morpho'],
      });

      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should handle multiple constraints', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_OPTIMIZE_RESPONSE);

      await module.optimize({
        ...SAMPLE_OPTIMIZE_PARAMS,
        constraints: [
          {
            kind: WalletConstraints.MIN_PROTOCOLS,
            params: { min_protocols: 2 },
          },
          {
            kind: WalletConstraints.EXCLUDE_PROTOCOL,
            params: { protocol: 'compound' },
          },
        ],
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({
              kind: 'min_protocols',
            }),
            expect.objectContaining({
              kind: 'exclude_protocol',
            }),
          ]),
        })
      );
    });

    // ============================================================================
    // HTTP Error Handling
    // ============================================================================

    it('should propagate HTTP errors from HttpClient', async () => {
      const httpError = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(httpError);

      await expect(
        module.optimize(SAMPLE_OPTIMIZE_PARAMS)
      ).rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      const apiError = {
        statusCode: 400,
        message: 'Invalid optimization parameters',
      };
      mockHttpClient.post.mockRejectedValue(apiError);

      await expect(
        module.optimize(SAMPLE_OPTIMIZE_PARAMS)
      ).rejects.toEqual(apiError);
    });
  });
});

