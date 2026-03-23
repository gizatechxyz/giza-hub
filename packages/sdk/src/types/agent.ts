import { Address, Chain } from './common';

// ============================================================================
// Enums
// ============================================================================

export enum AgentStatus {
  UNKNOWN = 'unknown',
  ACTIVATING = 'activating',
  ACTIVATION_FAILED = 'activation_failed',
  ACTIVATED = 'activated',
  RUNNING = 'running',
  RUN_FAILED = 'run_failed',
  BLOCKED = 'blocked',
  DEACTIVATING = 'deactivating',
  DEACTIVATION_FAILED = 'deactivation_failed',
  DEACTIVATED = 'deactivated',
  EMERGENCY = 'emergency',
  DEACTIVATED_FEE_NOT_PAID = 'deactivated_fee_not_paid',
  BRIDGING = 'bridging',
}

export enum TxAction {
  UNKNOWN = 'unknown',
  APPROVE = 'approve',
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  BRIDGE = 'bridge',
  WITHDRAW = 'withdraw',
  SWAP = 'swap',
  REFILL_GAS_TANK = 'refill_gas_tank',
  WRAP = 'wrap',
  UNWRAP = 'unwrap',
  FEE_TRANSFER = 'fee_transfer',
}

export enum TxStatus {
  UNKNOWN = 'unknown',
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum SortOrder {
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
}

export enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

export enum Period {
  ALL = 'all',
  DAY = 'day',
}

export enum ExecutionStatus {
  RUNNING = 'running',
  FAILED = 'failed',
  SUCCESS = 'success',
}

// ============================================================================
// Option Types (what consumers construct)
// ============================================================================

export interface ActivateOptions {
  owner: Address;
  token: Address;
  protocols: string[];
  txHash: string;
  constraints?: ConstraintConfig[];
}

export interface AprOptions {
  startDate?: string;
  endDate?: string;
  useExactEndDate?: boolean;
}

export interface PerformanceOptions {
  from?: string;
}

export interface DeactivateOptions {
  transfer?: boolean;
}

export interface WaitForDeactivationOptions {
  interval?: number;
  timeout?: number;
  onUpdate?: (status: AgentStatus) => void;
}

export interface PaginationOptions {
  limit?: number;
  sort?: string;
}

// ============================================================================
// Smart Account Types
// ============================================================================

export interface SmartAccountInfo {
  smartAccountAddress: Address;
  backendWallet: Address;
  origin_wallet: Address;
  chain: Chain;
}

export interface ZerodevSmartWalletResponse {
  smartAccount: string;
  backendWallet: string;
}

// ============================================================================
// Protocol Types
// ============================================================================

export interface ProtocolPool {
  name: string;
  apy: number;
}

export interface Protocol {
  name: string;
  is_active: boolean;
  description: string;
  tvl: number;
  apr: number | null;
  pools: ProtocolPool[] | null;
  created_at: string;
  updated_at: string | null;
  chain_id: number;
  parent_protocol: string;
  link: string;
  address: string | null;
  agent_token: string | null;
  title: string | null;
}

export interface ProtocolsRawResponse {
  protocols: Protocol[];
}

export interface ProtocolsResponse {
  protocols: string[];
}

export interface ProtocolSupply {
  protocol: string;
  supply: number;
  tokens: string[];
}

export interface ProtocolsSupplyResponse {
  protocols: ProtocolSupply[];
}

// ============================================================================
// Activation Types
// ============================================================================

export interface ConstraintConfig {
  kind: string;
  params: Record<string, unknown>;
}

export interface ActivateResponse {
  message: string;
  wallet: string;
}

export interface DeactivateResponse {
  message: string;
}

export interface TopUpResponse {
  message: string;
}

export interface RunResponse {
  status: string;
}

// ============================================================================
// Performance & Portfolio Types
// ============================================================================

export interface Deposit {
  amount: number;
  token_type: string;
  date?: string;
  tx_hash?: string;
  block_number?: number;
}

export interface WithdrawDetail {
  token: string;
  amount: string;
  value: number;
  value_in_usd: number;
  principal_amount?: number;
  yield_amount?: number;
  fee_amount?: number;
  tx_hash?: string;
  block_number?: number;
}

export interface Withdraw {
  date: string;
  amount: number;
  value: number;
  withdraw_details: WithdrawDetail[];
}

export interface AgentInfo {
  wallet: Address;
  deposits: Deposit[];
  withdraws?: Withdraw[];
  status: AgentStatus;
  activation_date: string;
  last_deactivation_date?: string;
  last_reactivation_date?: string;
  selected_protocols: string[];
  current_protocols?: string[];
  current_token?: string;
  eoa?: Address;
}

export interface AccruedRewardsWithValue {
  locked: number;
  unlocked: number;
  locked_value: number;
  locked_value_usd: number;
  unlocked_value: number;
  unlocked_value_usd: number;
  claimed?: number;
  claimed_value?: number;
  claimed_value_usd?: number;
}

export interface AllocatedValue {
  value: number;
  value_in_usd: number;
  base_apr?: number;
  total_apr?: number;
}

export type Portfolio = Record<string, AllocatedValue>;

export type AccruedRewardsBySymbol = Record<string, AccruedRewardsWithValue>;

export type AprByTokenResponse = AllocatedValue[];

export interface PerformanceData {
  date: string;
  value: number;
  value_in_usd?: number;
  accrued_rewards?: AccruedRewardsBySymbol;
  portfolio?: Portfolio;
  agent_token_amount?: number;
}

export interface PerformanceChartResponse {
  performance: PerformanceData[];
}

// ============================================================================
// Transaction History Types
// ============================================================================

export interface Transaction {
  action: TxAction;
  date: string;
  amount: number;
  amount_out?: number;
  token_type: string;
  status: TxStatus;
  transaction_hash?: string;
  protocol?: string;
  new_token?: string;
  correlation_id?: string;
  apr?: number;
  block_number?: number;
}

export interface PaginationInfo {
  page: number;
  items_per_page: number;
  total_pages: number;
  total_items: number;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: PaginationInfo;
}

// ============================================================================
// APR Types
// ============================================================================

export interface WalletAprSubPeriod {
  start_date: string;
  end_date: string;
  return_: number;
  initial_value: number;
}

export interface WalletAprResponse {
  apr: number;
  sub_periods?: WalletAprSubPeriod[];
}

// ============================================================================
// Withdrawal Types
// ============================================================================

export interface FullWithdrawResponse {
  message: string;
}

export interface PartialWithdrawResponse {
  date: string;
  amount: number;
  value: number;
  withdraw_details: WithdrawDetail[];
}

export type WithdrawResponse = FullWithdrawResponse | PartialWithdrawResponse;

export interface WithdrawalStatusResponse {
  status: AgentStatus;
  wallet: Address;
  activation_date: string;
  last_deactivation_date?: string;
  last_reactivation_date?: string;
}

// ============================================================================
// Fee Types
// ============================================================================

export interface FeeResponse {
  percentage_fee: number;
  fee: number;
}

// ============================================================================
// Limit Types
// ============================================================================

export interface LimitResponse {
  limit: number;
}

// ============================================================================
// Deposits Types
// ============================================================================

export interface DepositListResponse {
  deposits: Deposit[];
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecutionWithTransactionsDTO {
  id: string;
  execution_plan: unknown;
  execution_type: string;
  status: ExecutionStatus;
  created_at: string;
  transactions: Transaction[];
}

export interface PaginatedExecutionDTO {
  items: ExecutionWithTransactionsDTO[];
  total: number;
}

// ============================================================================
// Log Types
// ============================================================================

export interface LogDTO {
  type: string;
  data: unknown;
}

export interface PaginatedLogDTO {
  items: LogDTO[];
  total: number;
}

// ============================================================================
// Stats Types
// ============================================================================

export interface TokenDistributionItem {
  token: string;
  amount: number;
  percentage: number;
}

export interface ProtocolDistribution {
  protocol: string;
  amount: number;
  percentage: number;
}

export interface LiquidityDistribution {
  initial_deposits: TokenDistributionItem[];
  current_tokens: TokenDistributionItem[];
  protocols: ProtocolDistribution[];
}

export interface Statistics {
  total_balance: number;
  total_deposits: number;
  total_users: number;
  total_transactions: number;
  total_apr: number;
  liquidity_distribution: LiquidityDistribution;
}

// ============================================================================
// Token Types
// ============================================================================

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  balance: number;
  current_price: number;
}

export interface TokensResponse {
  tokens: TokenInfo[];
}

// ============================================================================
// Reward History Types
// ============================================================================

export interface RewardDTO {
  user_id: string;
  base_apr: number;
  extra_apr: number;
  ticker: string;
  reward_amount: number;
  group: string;
  transaction_hash: string;
  start_date: string;
  end_date: string;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedRewardDTO {
  items: RewardDTO[];
  total: number;
}

// ============================================================================
// Config Types
// ============================================================================

export interface ConstraintConfigResponse {
  [key: string]: unknown;
}

export interface ChainConfigResponse {
  [key: string]: unknown;
}

export interface GlobalConfigResponse {
  min_withdraw_usd: number;
  optimizer_threshold_usd: number;
  max_protocol_liquidity_percentage: number;
  constraints: ConstraintConfigResponse;
  chains: Record<string, ChainConfigResponse>;
}

// ============================================================================
// Health & Chains Types
// ============================================================================

export interface HealthcheckResponse {
  message: string;
  version: string;
  time: string;
}

export interface ChainsResponse {
  chain_ids: number[];
}
