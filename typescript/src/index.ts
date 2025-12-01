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
  TokenDistribution,
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

// Enums
export {
  AgentStatus,
  TxAction,
  TxStatus,
  SortOrder,
} from './types/agent';

// HTTP Errors
export {
  GizaAPIError,
  TimeoutError,
  NetworkError,
} from './http/errors';

// Constants
export { DEFAULT_AGENT_ID, DEFAULT_TIMEOUT, CHAIN_NAMES } from './constants';
