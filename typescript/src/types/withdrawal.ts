import { Address } from './common';
import { AgentStatus } from './performance';

/**
 * Parameters for requesting a withdrawal
 */
export interface WithdrawalRequestParams {
  /** Smart account wallet address to withdraw from */
  wallet: Address;
  /** Whether to transfer remaining balance to the owner (defaults to true) */
  transfer?: boolean;
}

/**
 * Response from withdrawal request
 */
export interface WithdrawalRequestResponse {
  /** Confirmation message */
  message: string;
}

/**
 * Parameters for checking withdrawal status
 */
export interface WithdrawalStatusParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Origin wallet address */
  origin_wallet?: Address;
}

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
 * Parameters for getting withdrawal fees
 */
export interface WithdrawalFeeParams {
  /** Smart account wallet address */
  wallet: Address;
}

/**
 * Withdrawal fee response
 */
export interface WithdrawalFeeResponse {
  /** Fee percentage (e.g., 0.1 for 10%) */
  percentage_fee: number;
  /** Absolute fee amount */
  fee: number;
}

/**
 * Parameters for getting withdrawal history
 */
export interface WithdrawalHistoryParams {
  /** Smart account wallet address */
  wallet: Address;
  /** Page number (starts at 1) */
  page?: number;
  /** Number of items per page (max 100) */
  limit?: number;
}

/**
 * Options for polling withdrawal status
 */
export interface PollStatusOptions {
  /** Polling interval in milliseconds (default: 5000ms) */
  interval?: number;
  /** Timeout in milliseconds (default: 300000ms = 5 minutes) */
  timeout?: number;
  /** Callback function called on each status update */
  onUpdate?: (status: AgentStatus) => void;
}

