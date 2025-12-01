/**
 * Giza Agent SDK
 * 
 * TypeScript SDK for integrating Giza's agents.
 * 
 * @packageDocumentation
 */

// Main client
export { GizaAgent } from './client';

// Types
export type { GizaAgentConfig, ResolvedGizaAgentConfig } from './types/config';
export type {
  CreateSmartAccountParams,
  GetSmartAccountParams,
  UpdatePermissionsParams,
  SmartAccountInfo,
} from './types/smart-account';
export type { Address } from './types/common';
export type {
  GetChartParams,
  GetPortfolioParams,
  GetTransactionsParams,
  GetAPRParams,
  PerformanceChartResponse,
  PerformanceData,
  AgentInfo,
  Deposit,
  Withdraw,
  WithdrawDetail,
  TransactionHistoryResponse,
  Transaction,
  PaginationInfo,
  WalletAprResponse,
  WalletAprSubPeriod,
  AccruedRewardsWithValue,
  AllocatedValue,
  Portfolio,
  AccruedRewardsBySymbol,
  TokenDistribution,
} from './types/performance';

// Enums
export { Chain } from './types/common';
export { 
  AgentStatus,
  TxAction,
  TxStatus,
  SortOrder,
} from './types/performance';

// Errors
export {
  GizaError,
  NotImplementedError,
  ValidationError,
} from './types/common';
export {
  GizaAPIError,
  TimeoutError,
  NetworkError,
} from './http/errors';

// Constants
export { DEFAULT_AGENT_ID, DEFAULT_TIMEOUT, CHAIN_NAMES } from './constants';

