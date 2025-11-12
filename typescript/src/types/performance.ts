import { Address } from './common';

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
 * Agent wallet information
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
  /** Current protocol (deprecated, use current_protocols) */
  current_protocol?: string;
  /** Current protocols the agent is using */
  current_protocols?: string[];
  /** Current token being managed */
  current_token?: string;
  /** Origin wallet address */
  origin_wallet?: Address;
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
 * Parameters for getChart method
 */
export interface GetChartParams {
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
  origin_wallet?: boolean;
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

