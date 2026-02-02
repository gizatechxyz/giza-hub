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
   * Constraint-specific parameters
   * Examples:
   * - MIN_PROTOCOLS: { min_protocols: 2 }
   * - EXCLUDE_PROTOCOL: { protocol: "compound" }
   * - MAX_AMOUNT_PER_PROTOCOL: { protocol: "aave", max_amount: "1000000" }
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

