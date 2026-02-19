import { Address, Chain } from './common';

// ============================================================================
// Enums
// ============================================================================

/**
 * Wallet constraint types for optimization
 */
export enum WalletConstraints {
  MIN_PROTOCOLS = 'min_protocols',
  MAX_ALLOCATION_AMOUNT_PER_PROTOCOL = 'max_allocation_amount_per_protocol',
  MAX_AMOUNT_PER_PROTOCOL = 'max_amount_per_protocol',
  MIN_AMOUNT = 'min_amount',
  EXCLUDE_PROTOCOL = 'exclude_protocol',
  MIN_ALLOCATION_AMOUNT_PER_PROTOCOL = 'min_allocation_amount_per_protocol',
}

// ============================================================================
// Constraint Types
// ============================================================================

/**
 * Constraint configuration for optimization
 */
export interface ConstraintConfig {
  /**
   * Type of constraint to apply
   */
  kind: WalletConstraints;

  /**
   * Constraint-specific parameters (varies by constraint kind)
   *
   * Parameter requirements by constraint type:
   *
   * - MIN_PROTOCOLS:
   *   { min_protocols: number, min_fraction_per_protocol?: number }
   *   - min_protocols: Minimum number of protocols to use (required)
   *   - min_fraction_per_protocol: Minimum fraction per protocol (optional, default 0.05, range 0.01-1.0)
   *
   * - MAX_AMOUNT_PER_PROTOCOL:
   *   { protocol: string, max_ratio: number }
   *   - protocol: Protocol name to constrain (required)
   *   - max_ratio: Maximum ratio of total capital (required, range 0-1, e.g., 0.5 for 50%)
   *
   * - MAX_ALLOCATION_AMOUNT_PER_PROTOCOL:
   *   { protocol: string, max_amount: number }
   *   - protocol: Protocol name to constrain (required)
   *   - max_amount: Maximum absolute amount in token units (required)
   *
   * - MIN_AMOUNT:
   *   { min_amount: number }
   *   - min_amount: Minimum amount to allocate to any used protocol (required)
   *
   * - MIN_ALLOCATION_AMOUNT_PER_PROTOCOL:
   *   { protocol: string, min_amount: number }
   *   - protocol: Protocol name to constrain (required)
   *   - min_amount: Minimum amount to allocate to this protocol (required)
   *
   * - EXCLUDE_PROTOCOL:
   *   { protocol: string }
   *   - protocol: Protocol name to exclude (required)
   *
   * @example
   * // Require at least 2 protocols
   * { kind: WalletConstraints.MIN_PROTOCOLS, params: { min_protocols: 2 } }
   *
   * @example
   * // Cap aave at 50% of total capital
   * { kind: WalletConstraints.MAX_AMOUNT_PER_PROTOCOL, params: { protocol: "aave", max_ratio: 0.5 } }
   *
   * @example
   * // Cap compound at absolute 500 USDC (500000000 in 6 decimals)
   * { kind: WalletConstraints.MAX_ALLOCATION_AMOUNT_PER_PROTOCOL, params: { protocol: "compound", max_amount: 500000000 } }
   *
   * @example
   * // Exclude moonwell from optimization
   * { kind: WalletConstraints.EXCLUDE_PROTOCOL, params: { protocol: "moonwell" } }
   */
  params: Record<string, unknown>;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Parameters for optimization request
 */
export interface OptimizeRequest {
  /**
   * Total amount to allocate (bigint as string)
   * Example: "1000000000" for 1000 USDC (6 decimals)
   */
  total_capital: string;

  /**
   * Token address to optimize for (e.g., USDC address)
   */
  token_address: Address;

  /**
   * Current allocations mapping protocol names to amounts (bigint as string)
   * Example: { "aave": "500000000", "compound": "500000000" }
   */
  current_allocations: Record<string, string>;

  /**
   * List of protocol names to consider for optimization
   * Example: ["aave", "compound", "moonwell", "fluid"]
   */
  protocols: string[];

  /**
   * Optional list of constraint specifications
   */
  constraints?: ConstraintConfig[];

  /**
   * Optional wallet address that will execute the transactions.
   * Example: "0x1234567890123456789012345678901234567890"
   */
  wallet_address?: Address;
}

/**
 * Parameters for the optimize method (includes chainId)
 */
export interface OptimizeParams extends OptimizeRequest {
  /**
   * Chain ID to optimize for
   */
  chainId: Chain;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Allocation details for a specific protocol
 */
export interface ProtocolAllocation {
  /**
   * Protocol name
   */
  protocol: string;

  /**
   * Allocated amount (bigint as string)
   */
  allocation: string;

  /**
   * APR for this protocol (percentage)
   */
  apr: number;
}

/**
 * Optimization result containing allocations and performance metrics
 */
export interface OptimizationResult {
  /**
   * List of protocol allocations
   */
  allocations: ProtocolAllocation[];

  /**
   * Total gas costs for executing the rebalancing
   */
  total_costs: number;

  /**
   * Initial weighted APR before optimization (percentage)
   */
  weighted_apr_initial: number;

  /**
   * Final weighted APR after optimization (percentage)
   */
  weighted_apr_final: number;

  /**
   * APR improvement percentage
   */
  apr_improvement: number;

  /**
   * Estimated total gas cost in USD for executing the rebalancing
   */
  gas_estimate_usd?: number;

  /**
   * Number of days until APR improvement exceeds gas cost
   */
  break_even_days?: number;
}

/**
 * Details of a single action (deposit or withdraw)
 */
export interface ActionDetail {
  /**
   * Type of action: 'deposit' or 'withdraw'
   */
  action_type: 'deposit' | 'withdraw';

  /**
   * Protocol name
   */
  protocol: string;

  /**
   * Amount for the action (bigint as string)
   */
  amount: string;

  /**
   * Underlying token amount for withdrawals (bigint as string, optional)
   */
  underlying_amount?: string;
}

/**
 * Execution-ready calldata for a transaction
 */
export interface CalldataInfo {
  /**
   * Target contract address
   */
  contract_address: string;

  /**
   * Function name to call
   */
  function_name: string;

  /**
   * Function parameters (ABI-encoded)
   */
  parameters: string[];

  /**
   * Native token value to send with transaction (bigint as string, defaults to "0")
   */
  value: string;

  /**
   * Protocol name for reference
   */
  protocol: string;

  /**
   * Human-readable description of the transaction
   */
  description: string;
}

/**
 * Response from optimization endpoint
 * Contains optimization results, action plan, and execution-ready calldata
 */
export interface OptimizeResponse {
  /**
   * Optimization results with allocations and performance metrics
   */
  optimization_result: OptimizationResult;

  /**
   * Ordered list of actions to achieve the optimal allocation
   */
  action_plan: ActionDetail[];

  /**
   * Execution-ready transaction data for all actions
   */
  calldata: CalldataInfo[];
}

