import { Address, Chain } from './common';

// ============================================================================
// Enums
// ============================================================================

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

export interface ConstraintConfig {
  kind: WalletConstraints;
  params: Record<string, unknown>;
}

// ============================================================================
// Option Types (what consumers construct)
// ============================================================================

export interface OptimizeOptions {
  /** Chain to optimize for. Defaults to client chain if omitted. */
  chain?: Chain;
  token: Address;
  capital: string;
  currentAllocations: Record<string, string>;
  protocols: string[];
  constraints?: ConstraintConfig[];
  wallet?: Address;
}

// ============================================================================
// Internal Request Types (sent to API)
// ============================================================================

export interface OptimizeRequest {
  total_capital: string;
  token_address: Address;
  current_allocations: Record<string, string>;
  protocols: string[];
  constraints?: ConstraintConfig[];
  wallet_address?: Address;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ProtocolAllocation {
  protocol: string;
  allocation: string;
  apr: number;
}

export interface OptimizationResult {
  allocations: ProtocolAllocation[];
  total_costs: number;
  weighted_apr_initial: number;
  weighted_apr_final: number;
  apr_improvement: number;
  gas_estimate_usd?: number;
  break_even_days?: number;
}

export interface ActionDetail {
  action_type: 'deposit' | 'withdraw';
  protocol: string;
  amount: string;
  underlying_amount?: string;
}

export interface CalldataInfo {
  contract_address: string;
  function_name: string;
  parameters: string[];
  value: string;
  protocol: string;
  description: string;
}

export interface OptimizeResponse {
  optimization_result: OptimizationResult;
  action_plan: ActionDetail[];
  calldata: CalldataInfo[];
}

