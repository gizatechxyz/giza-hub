import { HttpClient } from '../http/client';
import { ResolvedGizaAgentConfig } from '../types/config';
import { Chain, ValidationError } from '../types/common';
import { ADDRESS_REGEX } from '../constants';
import {
  OptimizeParams,
  OptimizeRequest,
  OptimizeResponse,
} from '../types/optimizer';

/**
 * Optimizer Module
 * 
 * Provides access to Giza's optimization service as a stateless API.
 * The optimizer analyzes current capital allocations and returns:
 * - Optimal target allocations across protocols
 * - Detailed action plan (deposits/withdrawals)
 * - Execution-ready calldata for all transactions
 */
export class OptimizerModule {
  constructor(
    private readonly httpClient: HttpClient,
    _config: ResolvedGizaAgentConfig
  ) {
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  /**
   * Validate Ethereum address format
   */
  private validateAddress(address: string, fieldName: string): void {
    if (!address) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!ADDRESS_REGEX.test(address)) {
      throw new ValidationError(
        `${fieldName} must be a valid Ethereum address (0x followed by 40 hex characters)`
      );
    }
  }

  /**
   * Validate that a string represents a positive integer
   */
  private validatePositiveIntegerString(value: string, fieldName: string): void {
    if (!value) {
      throw new ValidationError(`${fieldName} is required`);
    }

    try {
      const num = BigInt(value);
      if (num <= 0n) {
        throw new ValidationError(`${fieldName} must be a positive integer`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `${fieldName} must be a valid positive integer string, got: ${value}`
      );
    }
  }

  /**
   * Validate that a string represents a non-negative integer
   */
  private validateNonNegativeIntegerString(
    value: string,
    fieldName: string
  ): void {
    if (value === undefined || value === null) {
      throw new ValidationError(`${fieldName} is required`);
    }

    try {
      const num = BigInt(value);
      if (num < 0n) {
        throw new ValidationError(`${fieldName} must be non-negative`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `${fieldName} must be a valid non-negative integer string, got: ${value}`
      );
    }
  }

  /**
   * Validate chain ID is supported
   */
  private validateChainId(chainId: Chain): void {
    const validChains = Object.values(Chain).filter(
      (v) => typeof v === 'number'
    ) as number[];

    if (!validChains.includes(chainId)) {
      throw new ValidationError(
        `chainId must be one of: ${validChains.join(', ')}. Got: ${chainId}`
      );
    }
  }

  // ============================================================================
  // Optimization Operations
  // ============================================================================

  /**
   * Optimize capital allocation across lending protocols
   * 
   * This method provides Giza's optimization intelligence as a service. It analyzes
   * current allocations and returns:
   * - Optimal target allocations across protocols
   * - Detailed action plan (deposits/withdrawals)
   * - Execution-ready calldata for all transactions
   * 
   * @param params - Optimization parameters including chainId, allocations, and constraints
   * @returns Optimization response with results, action plan, and calldata
   * 
   * @example
   * ```typescript
   * const result = await giza.optimizer.optimize({
   *   chainId: Chain.BASE,
   *   total_capital: "1000000000",
   *   token_address: USDC_ADDRESS,
   *   current_allocations: {
   *     aave: "500000000",
   *     compound: "500000000"
   *   },
   *   protocols: ["aave", "compound", "moonwell"],
   *   constraints: [
   *     {
   *       kind: WalletConstraints.MIN_PROTOCOLS,
   *       params: { min_protocols: 2 }
   *     }
   *   ]
   * });
   * 
   * console.log(`APR improvement: ${result.optimization_result.apr_improvement}%`);
   * console.log(`Actions: ${result.action_plan.length}`);
   * ```
   */
  public async optimize(params: OptimizeParams): Promise<OptimizeResponse> {
    // Validate chainId
    this.validateChainId(params.chainId);

    // Validate token address
    this.validateAddress(params.token_address, 'token address');

    // Validate total_capital
    this.validatePositiveIntegerString(params.total_capital, 'total_capital');

    // Validate protocols array
    if (!params.protocols || params.protocols.length === 0) {
      throw new ValidationError('At least one protocol must be provided');
    }

    // Validate current_allocations
    if (!params.current_allocations || typeof params.current_allocations !== 'object') {
      throw new ValidationError('current_allocations must be an object');
    }

    // Validate each allocation value
    for (const [protocol, amount] of Object.entries(params.current_allocations)) {
      this.validateNonNegativeIntegerString(
        amount,
        `current_allocations.${protocol}`
      );
    }

    const requestBody: OptimizeRequest = {
      total_capital: params.total_capital,
      token_address: params.token_address,
      current_allocations: params.current_allocations,
      protocols: params.protocols,
      constraints: params.constraints,
    };

    const response = await this.httpClient.post<OptimizeResponse>(
      `/api/v1/optimizer/${params.chainId}/optimize`,
      requestBody
    );

    return response;
  }
}

