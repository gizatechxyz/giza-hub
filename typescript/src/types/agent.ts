import { Address, Chain } from './common';

// ============================================================================
// Enums
// ============================================================================

/**
 * Agent status enum
 */
export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  DEACTIVATING = 'DEACTIVATING',
  ACTIVATING = 'ACTIVATING',
  DEACTIVATED_FEE_NOT_PAID = 'DEACTIVATED_FEE_NOT_PAID',
}

/**
 * Transaction action types
 */
export enum TxAction {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  SUPPLY = 'SUPPLY',
  WITHDRAW_SUPPLY = 'WITHDRAW_SUPPLY',
  SWAP = 'SWAP',
  CLAIM = 'CLAIM',
}

/**
 * Transaction status types
 */
export enum TxStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
}

/**
 * Sort order for transaction history
 */
export enum SortOrder {
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
}

// ============================================================================
// Smart Account Types
// ============================================================================

/**
 * Parameters for creating a new smart account
 */
export interface CreateSmartAccountParams {
  /**
   * Origin wallet address (user's wallet - can be EOA or smart wallet)
   */
  origin_wallet: Address;
}

/**
 * Parameters for retrieving smart account information
 */
export interface GetSmartAccountParams {
  /**
   * Smart account address to query
   */
  smartAccount?: Address;

  /**
   * Origin wallet address to query
   */
  origin_wallet?: Address;
}

/**
 * Smart account information returned from API
 */
export interface SmartAccountInfo {
  /**
   * The smart account address
   */
  smartAccountAddress: Address;

  /**
   * The backend wallet address that manages the smart account
   */
  backendWallet: Address;

  /**
   * The origin wallet address that owns the smart account
   */
  origin_wallet: Address;

  /**
   * The blockchain network the smart account is on
   */
  chain: Chain;
}

/**
 * Raw response from the backend API for smart account creation
 */
export interface ZerodevSmartWalletResponse {
  smartAccount: string;
  backendWallet: string;
}

// ============================================================================
// Protocol Types
// ============================================================================

/**
 * Response from get protocols endpoint
 */
export interface ProtocolsResponse {
  protocols: string[];
}

/**
 * Protocol supply information
 */
export interface ProtocolSupply {
  protocol: string;
  supply: number;
  tokens: string[];
}

/**
 * Response from get protocols supply endpoint
 */
export interface ProtocolsSupplyResponse {
  protocols: ProtocolSupply[];
}

// ============================================================================
// Activation Types
// ============================================================================

/**
 * Constraint configuration for agent activation
 */
export interface ConstraintConfig {
  kind: string;
  params: Record<string, unknown>;
}

/**
 * Parameters for activating an agent
 */
export interface ActivateParams {
  /**
   * Smart account wallet address to activate
   */
  wallet: Address;

  /**
   * Origin wallet address (EOA or smart wallet that owns the smart account)
   */
  origin_wallet: Address;

  /**
   * Initial token address for deposits (e.g., USDC address)
   */
  initial_token: Address;

  /**
   * List of protocol names to use for yield optimization
   */
  selected_protocols: string[];

  /**
   * Transaction hash of the initial deposit (optional)
   */
  tx_hash?: string;

  /**
   * Constraints for agent behavior (optional)
   */
  constraints?: ConstraintConfig[];
}

/**
 * Response from agent activation
 */
export interface ActivateResponse {
  message: string;
  wallet: string;
}

/**
 * Parameters for deactivating an agent
 */
export interface DeactivateParams {
  /**
   * Smart account wallet address to deactivate
   */
  wallet: Address;

  /**
   * Whether to transfer remaining balance to origin wallet (defaults to true)
   */
  transfer?: boolean;
}

/**
 * Response from agent deactivation
 */
export interface DeactivateResponse {
  message: string;
}

/**
 * Parameters for topping up an agent
 */
export interface TopUpParams {
  /**
   * Smart account wallet address
   */
  wallet: Address;

  /**
   * Transaction hash of the top-up deposit
   */
  tx_hash: string;
}

/**
 * Response from top-up operation
 */
export interface TopUpResponse {
  message: string;
}

/**
 * Parameters for running an agent
 */
export interface RunParams {
  /**
   * Smart account wallet address
   */
  wallet: Address;
}

/**
 * Response from agent run
 */
export interface RunResponse {
  status: string;
}

// ============================================================================
// Performance & Portfolio Types
// ============================================================================

/**
 * Deposit information
 */
export interface Deposit {
  /** Deposit amount (BigInt as number) */
  amount: number;
  /** Token type/address */
  token_type: string;
  /** Deposit date */
  date?: string;
  /** Transaction hash */
  tx_hash?: string;
}

/**
 * Withdraw detail for a specific token
 */
export interface WithdrawDetail {
  /** Token address */
  token: string;
  /** Amount withdrawn */
  amount: number;
  /** Value in token */
  value: number;
  /** Value in USD */
  value_in_usd: number;
}

/**
 * Withdraw information
 */
export interface Withdraw {
  /** Withdraw date */
  date: string;
  /** Total value of withdrawal */
  total_value: number;
  /** Total value in USD */
  total_value_in_usd: number;
  /** Details for each token withdrawn */
  withdraw_details: WithdrawDetail[];
}

/**
 * Agent wallet information / Portfolio
 */
export interface AgentInfo {
  /** Smart account wallet address */
  wallet: Address;
  /** List of deposits */
  deposits: Deposit[];
  /** List of withdrawals */
  withdraws?: Withdraw[];
  /** Current agent status */
  status: AgentStatus;
  /** Agent activation date */
  activation_date: string;
  /** Last deactivation date */
  last_deactivation_date?: string;
  /** Last reactivation date */
  last_reactivation_date?: string;
  /** Selected protocols for the agent */
  selected_protocols: string[];
  /** Current protocols the agent is using */
  current_protocols?: string[];
  /** Current token being managed */
  current_token?: string;
  /** Origin wallet address */
  eoa?: Address;
}

/**
 * Accrued rewards with value information
 */
export interface AccruedRewardsWithValue {
  /** Locked reward amount */
  locked: number;
  /** Unlocked reward amount */
  unlocked: number;
  /** Locked reward value */
  locked_value: number;
  /** Locked reward value in USD */
  locked_value_usd: number;
  /** Unlocked reward value */
  unlocked_value: number;
  /** Unlocked reward value in USD */
  unlocked_value_usd: number;
}

/**
 * Allocated value in a protocol
 */
export interface AllocatedValue {
  /** Value allocated */
  value: number;
  /** Value in USD */
  value_in_usd: number;
}

/**
 * Portfolio allocation by protocol
 */
export type Portfolio = Record<string, AllocatedValue>;

/**
 * Accrued rewards by token symbol
 */
export type AccruedRewardsBySymbol = Record<string, AccruedRewardsWithValue>;

/**
 * Token distribution by symbol
 */
export type TokenDistribution = Record<string, number>;

/**
 * Performance data point
 */
export interface PerformanceData {
  /** Date of the performance snapshot */
  date: string;
  /** Total value */
  value: number;
  /** Total value in USD */
  value_in_usd?: number;
  /** Distribution of tokens */
  token_distribution?: TokenDistribution;
  /** Accrued rewards by token */
  accrued_rewards?: AccruedRewardsBySymbol;
  /** Portfolio allocation */
  portfolio?: Portfolio;
}

/**
 * Performance chart response
 */
export interface PerformanceChartResponse {
  /** Array of performance data points */
  performance: PerformanceData[];
}

/**
 * Parameters for getPerformance method
 */
export interface GetPerformanceParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Start date for performance data (ISO format or "YYYY-MM-DD HH:MM:SS") */
  from_date?: string;
}

/**
 * Parameters for getPortfolio method
 */
export interface GetPortfolioParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Whether the wallet parameter is an origin wallet address */
  is_origin_wallet?: boolean;
}

// ============================================================================
// Transaction History Types
// ============================================================================

/**
 * Transaction information
 */
export interface Transaction {
  /** Transaction action type */
  action: TxAction;
  /** Transaction date */
  date: string;
  /** Amount involved */
  amount: number;
  /** Token type/address */
  token_type: string;
  /** Transaction status */
  status: TxStatus;
  /** Transaction hash */
  transaction_hash?: string;
  /** Protocol involved */
  protocol?: string;
  /** New token (for swaps) */
  new_token?: string;
  /** Correlation ID for tracking */
  correlation_id?: string;
  /** APR at the time of transaction */
  apr?: number;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Total number of items */
  total_items: number;
  /** Total number of pages */
  total_pages: number;
  /** Current page number */
  current_page: number;
  /** Number of items per page */
  items_per_page: number;
}

/**
 * Transaction history response
 */
export interface TransactionHistoryResponse {
  /** Array of transactions */
  transactions: Transaction[];
  /** Pagination metadata */
  pagination: PaginationInfo;
}

/**
 * Parameters for getTransactions method
 */
export interface GetTransactionsParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Page number (starts at 1) */
  page?: number;
  /** Number of items per page (max 100) */
  limit?: number;
  /** Sort order for results */
  sort?: SortOrder;
}

// ============================================================================
// APR Types
// ============================================================================

/**
 * APR sub-period information
 */
export interface WalletAprSubPeriod {
  /** Start date of the period */
  start_date: string;
  /** End date of the period */
  end_date: string;
  /** Return for this period */
  return_: number;
  /** Initial value at start of period */
  initial_value: number;
}

/**
 * Wallet APR response
 */
export interface WalletAprResponse {
  /** Annual Percentage Rate */
  apr: number;
  /** Sub-period breakdown (if details requested) */
  sub_periods?: WalletAprSubPeriod[];
}

/**
 * Parameters for getAPR method
 */
export interface GetAPRParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Start date for APR calculation (ISO datetime) */
  start_date?: string;
  /** End date for APR calculation (ISO datetime) */
  end_date?: string;
  /** If true, use end_date as the exact last performance point */
  use_exact_end_date?: boolean;
}

// ============================================================================
// Withdrawal Types
// ============================================================================

/**
 * Parameters for withdraw method
 * 
 * Supports both partial and full withdrawal:
 * - If `amount` is specified: partial withdrawal (agent remains active)
 * - If `amount` is not specified: full withdrawal (agent is deactivated)
 */
export interface WithdrawParams {
  /** Smart account wallet address to withdraw from */
  wallet: Address;

  /**
   * Amount to withdraw (in token's smallest unit, e.g., wei for ETH, 6 decimals for USDC)
   * - If specified: partial withdrawal, agent remains active
   * - If not specified: full withdrawal, agent is deactivated
   */
  amount?: string;

  /** 
   * Whether to transfer withdrawn amount to origin wallet (defaults to true)
   * Only applicable for full withdrawal (deactivate)
   */
  transfer?: boolean;
}

/**
 * Response from full withdrawal (deactivate) request
 */
export interface FullWithdrawResponse {
  /** Confirmation message */
  message: string;
}

/**
 * Response from partial withdrawal request
 * Returns details about the withdrawn amounts
 */
export interface PartialWithdrawResponse {
  /** Withdraw date */
  date: string;
  /** Total value of withdrawal */
  total_value: number;
  /** Total value in USD */
  total_value_in_usd: number;
  /** Details for each token withdrawn */
  withdraw_details: WithdrawDetail[];
}

/**
 * Response from withdrawal request (union of partial and full)
 */
export type WithdrawResponse = FullWithdrawResponse | PartialWithdrawResponse;

/**
 * Withdrawal status response
 */
export interface WithdrawalStatusResponse {
  /** Current agent status */
  status: AgentStatus;
  /** Smart account wallet address */
  wallet: Address;
  /** Activation date */
  activation_date: string;
  /** Last deactivation date */
  last_deactivation_date?: string;
  /** Last reactivation date */
  last_reactivation_date?: string;
}

/**
 * Options for polling withdrawal status
 */
export interface PollWithdrawalStatusOptions {
  /** Polling interval in milliseconds (default: 5000ms) */
  interval?: number;
  /** Timeout in milliseconds (default: 300000ms = 5 minutes) */
  timeout?: number;
  /** Callback function called on each status update */
  onUpdate?: (status: AgentStatus) => void;
}

// ============================================================================
// Fee Types
// ============================================================================

/**
 * Fee response
 */
export interface FeeResponse {
  /** Fee percentage (e.g., 0.1 for 10%) */
  percentage_fee: number;
  /** Absolute fee amount */
  fee: number;
}

// ============================================================================
// Limit Types
// ============================================================================

/**
 * Parameters for getLimit method
 */
export interface GetLimitParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Origin wallet address (EOA) */
  origin_wallet: Address;
}

/**
 * Limit response
 */
export interface LimitResponse {
  /** Deposit limit */
  limit: number;
}

// ============================================================================
// Rewards Types
// ============================================================================

/**
 * Claimed reward for a specific token
 */
export interface ClaimedReward {
  /** Token address */
  token: string;
  /** Amount claimed (raw) */
  amount: number;
  /** Amount claimed (float) */
  amount_float: number;
  /** Current price in underlying token */
  current_price_in_underlying: number;
}

/**
 * Response from claim rewards
 */
export interface ClaimedRewardsResponse {
  /** Array of claimed rewards */
  rewards: ClaimedReward[];
}

// ============================================================================
// Deposits Types
// ============================================================================

/**
 * Deposit list response
 */
export interface DepositListResponse {
  /** Array of deposits */
  deposits: Deposit[];
}

