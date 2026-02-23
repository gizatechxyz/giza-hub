/**
 * Giza Agent SDK
 *
 * TypeScript SDK for integrating Giza's agents.
 *
 * @packageDocumentation
 */

// Main client
export { GizaAgent } from './client';

// Configuration types
export type { GizaAgentConfig, ResolvedGizaAgentConfig } from './types/config';

// Common types and errors
export type { Address } from './types/common';
export { Chain, GizaError, NotImplementedError, ValidationError } from './types/common';

// Agent types - Smart Account
export type {
  CreateSmartAccountParams,
  GetSmartAccountParams,
  SmartAccountInfo,
} from './types/agent';

// Agent types - Protocols
export type {
  ProtocolPool,
  Protocol,
  ProtocolsRawResponse,
  ProtocolsResponse,
  ProtocolSupply,
  ProtocolsSupplyResponse,
} from './types/agent';

// Agent types - Activation & Lifecycle
export type {
  ConstraintConfig,
  ActivateParams,
  ActivateResponse,
  DeactivateParams,
  DeactivateResponse,
  TopUpParams,
  TopUpResponse,
  RunParams,
  RunResponse,
} from './types/agent';

// Agent types - Performance & Portfolio
export type {
  Deposit,
  WithdrawDetail,
  Withdraw,
  AgentInfo,
  AccruedRewardsWithValue,
  AllocatedValue,
  Portfolio,
  AccruedRewardsBySymbol,
  AprByTokenResponse,
  PerformanceData,
  PerformanceChartResponse,
  GetPerformanceParams,
  GetPortfolioParams,
} from './types/agent';

// Agent types - Transactions
export type {
  Transaction,
  PaginationInfo,
  TransactionHistoryResponse,
  GetTransactionsParams,
} from './types/agent';

// Agent types - APR
export type {
  WalletAprSubPeriod,
  WalletAprResponse,
  GetAPRParams,
} from './types/agent';

// Agent types - Withdrawal
export type {
  WithdrawParams,
  WithdrawResponse,
  FullWithdrawResponse,
  PartialWithdrawResponse,
  WithdrawalStatusResponse,
  PollWithdrawalStatusOptions,
} from './types/agent';

// Agent types - Fees & Limits
export type {
  FeeResponse,
  GetLimitParams,
  LimitResponse,
} from './types/agent';

// Agent types - Rewards
export type {
  ClaimedReward,
  ClaimedRewardsResponse,
} from './types/agent';

// Agent types - Deposits
export type {
  DepositListResponse,
} from './types/agent';

// Agent types - Executions
export type {
  ExecutionWithTransactionsDTO,
  PaginatedExecutionDTO,
  GetExecutionsParams,
  GetExecutionLogsParams,
} from './types/agent';

// Agent types - Logs
export type {
  LogDTO,
  PaginatedLogDTO,
  GetLogsParams,
} from './types/agent';

// Agent types - Constraints
export type {
  UpdateConstraintsRequest,
} from './types/agent';

// Agent types - Stats
export type {
  TokenDistributionItem,
  ProtocolDistribution,
  LiquidityDistribution,
  Statistics,
} from './types/agent';

// Agent types - TVL
export type {
  TVLResponse,
} from './types/agent';

// Agent types - Tokens
export type {
  TokenInfo,
  TokensResponse,
} from './types/agent';

// Agent types - Reward History
export type {
  RewardDTO,
  PaginatedRewardDTO,
  GetRewardsParams,
  GetRewardHistoryParams,
} from './types/agent';

// Agent types - Config
export type {
  ConstraintConfigResponse,
  ChainConfigResponse,
  GlobalConfigResponse,
} from './types/agent';

// Agent types - Health & Chains
export type {
  HealthcheckResponse,
  ChainsResponse,
} from './types/agent';

// Optimizer types - Request & Response
export type {
  OptimizeRequest,
  OptimizeParams,
  OptimizeResponse,
  OptimizationResult,
  ProtocolAllocation,
  ActionDetail,
  CalldataInfo,
  ConstraintConfig as OptimizerConstraintConfig,
  SimulationRequest,
  SimulateParams,
  SimulationAllocation,
  SimulationResponse,
} from './types/optimizer';

// Optimizer module
export { OptimizerModule } from './modules/optimizer.module';

// Enums
export {
  AgentStatus,
  TxAction,
  TxStatus,
  SortOrder,
  Order,
  Period,
  ExecutionStatus,
} from './types/agent';

// Optimizer enums
export {
  WalletConstraints,
} from './types/optimizer';

// HTTP Errors
export {
  GizaAPIError,
  TimeoutError,
  NetworkError,
} from './http/errors';

// Constants
export { DEFAULT_AGENT_ID, DEFAULT_TIMEOUT, CHAIN_NAMES } from './constants';
