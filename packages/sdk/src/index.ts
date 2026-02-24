/**
 * Giza Agent SDK
 *
 * Resource-oriented TypeScript SDK for Giza yield agents.
 *
 * @packageDocumentation
 */

// Core classes
export { Giza } from './giza';
export { Agent } from './agent';
export { Paginator } from './paginator';
export type { PaginatedResponse, PageFetcher } from './paginator';

// Configuration
export type { GizaConfig, ResolvedGizaConfig } from './types/config';

// Common types and errors
export type { Address } from './types/common';
export {
  Chain,
  GizaError,
  NotImplementedError,
  ValidationError,
} from './types/common';

// Agent option types
export type {
  ActivateOptions,
  AprOptions,
  DeactivateOptions,
  PaginationOptions,
  PerformanceOptions,
  WaitForDeactivationOptions,
} from './types/agent';

// Agent domain / response types
export type {
  SmartAccountInfo,
  ProtocolPool,
  Protocol,
  ProtocolsRawResponse,
  ProtocolsResponse,
  ProtocolSupply,
  ProtocolsSupplyResponse,
  ConstraintConfig,
  ActivateResponse,
  DeactivateResponse,
  TopUpResponse,
  RunResponse,
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
  Transaction,
  PaginationInfo,
  TransactionHistoryResponse,
  WalletAprSubPeriod,
  WalletAprResponse,
  FullWithdrawResponse,
  PartialWithdrawResponse,
  WithdrawResponse,
  WithdrawalStatusResponse,
  FeeResponse,
  LimitResponse,
  ClaimedReward,
  ClaimedRewardsResponse,
  DepositListResponse,
  ExecutionWithTransactionsDTO,
  PaginatedExecutionDTO,
  LogDTO,
  PaginatedLogDTO,
  TokenDistributionItem,
  ProtocolDistribution,
  LiquidityDistribution,
  Statistics,
  TVLResponse,
  TokenInfo,
  TokensResponse,
  RewardDTO,
  PaginatedRewardDTO,
  ConstraintConfigResponse,
  ChainConfigResponse,
  GlobalConfigResponse,
  HealthcheckResponse,
  ChainsResponse,
} from './types/agent';

// Agent enums
export {
  AgentStatus,
  TxAction,
  TxStatus,
  SortOrder,
  Order,
  Period,
  ExecutionStatus,
} from './types/agent';

// Optimizer option types
export type {
  OptimizeOptions,
} from './types/optimizer';

// Optimizer domain / response types
export type {
  OptimizeRequest,
  OptimizeResponse,
  OptimizationResult,
  ProtocolAllocation,
  ActionDetail,
  CalldataInfo,
  ConstraintConfig as OptimizerConstraintConfig,
} from './types/optimizer';

// Optimizer enums
export { WalletConstraints } from './types/optimizer';

// HTTP errors
export {
  GizaAPIError,
  TimeoutError,
  NetworkError,
} from './http/errors';

// Constants
export { DEFAULT_AGENT_ID, DEFAULT_TIMEOUT, CHAIN_NAMES } from './constants';
