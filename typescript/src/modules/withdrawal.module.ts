import { HttpClient } from '../http/client';
import { ResolvedGizaAgentConfig } from '../types/config';
import { ValidationError } from '../types/common';
import { TimeoutError } from '../http/errors';
import { ADDRESS_REGEX } from '../constants';
import { AgentStatus, TxAction, TransactionHistoryResponse } from '../types/performance';
import {
  WithdrawalRequestParams,
  WithdrawalRequestResponse,
  WithdrawalStatusParams,
  WithdrawalStatusResponse,
  WithdrawalFeeParams,
  WithdrawalFeeResponse,
  WithdrawalHistoryParams,
  PollStatusOptions,
} from '../types/withdrawal';

/**
 * Withdrawal Module
 * Handles withdrawal requests, status tracking, and fee queries
 */
export class WithdrawalModule {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: ResolvedGizaAgentConfig
  ) {}

  /**
   * Validate Ethereum address format
   */
  private validateAddress(address: string, fieldName: string): void {
    if (!address) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!ADDRESS_REGEX.test(address)) {
      throw new ValidationError(
        `${fieldName} must be a valid Ethereum address (0x followed by 40 hex characters)`
      );
    }
  }

  /**
   * Request a withdrawal and initiate position unwinding
   * 
   * Note: Currently only supports full withdrawal. Partial withdrawal is not yet implemented.
   * This will deactivate the agent and unwind all positions.
   * 
   * @param params - Withdrawal request parameters
   * @returns Confirmation message
   * 
   * @example
   * ```typescript
   * // Request withdrawal with balance transfer to owner (default)
   * const response = await agent.withdrawal.request({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log(response.message);
   * 
   * // Request withdrawal without transferring balance
   * const response = await agent.withdrawal.request({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
   *   transfer: false
   * });
   * ```
   */
  public async request(params: WithdrawalRequestParams): Promise<WithdrawalRequestResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Default transfer to true (transfer remaining balance to owner)
    const transfer = params.transfer !== undefined ? params.transfer : true;

    // Build query parameters
    const queryParams = new URLSearchParams({
      transfer: transfer.toString(),
    });

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}:deactivate?${queryParams.toString()}`;

    // Make API request
    const response = await this.httpClient.post<WithdrawalRequestResponse>(url);
    return response;
  }

  /**
   * Check withdrawal request status
   * 
   * Returns the current status of the agent/wallet, which indicates the state
   * of the withdrawal process.
   * 
   * Status values:
   * - ACTIVE: Agent is active, no withdrawal in progress
   * - DEACTIVATING: Withdrawal in progress, positions being unwound
   * - DEACTIVATED: Withdrawal complete
   * - DEACTIVATED_FEE_NOT_PAID: Deactivation completed but fees not yet paid
   * 
   * @param params - Status query parameters
   * @returns Current withdrawal status
   * 
   * @example
   * ```typescript
   * const status = await agent.withdrawal.getStatus({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log(`Current status: ${status.status}`);
   * ```
   */
  public async getStatus(params: WithdrawalStatusParams): Promise<WithdrawalStatusResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.origin_wallet) {
      queryParams.append('eoa', params.origin_wallet);
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}${
      queryString ? `?${queryString}` : ''
    }`;

    // Make API request - reuse the AgentInfo endpoint
    const agentInfo = await this.httpClient.get<{
      wallet: string;
      status: AgentStatus;
      activation_date: string;
      last_deactivation_date?: string;
      last_reactivation_date?: string;
    }>(url);

    return {
      status: agentInfo.status,
      wallet: agentInfo.wallet as `0x${string}`,
      activation_date: agentInfo.activation_date,
      last_deactivation_date: agentInfo.last_deactivation_date,
      last_reactivation_date: agentInfo.last_reactivation_date,
    };
  }

  /**
   * Get past withdrawal requests
   * 
   * Retrieves transaction history filtered for withdrawal transactions.
   * 
   * @param params - History query parameters
   * @returns Transaction history with withdrawal transactions
   * 
   * @example
   * ```typescript
   * const history = await agent.withdrawal.getHistory({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
   *   page: 1,
   *   limit: 20
   * });
   * 
   * history.transactions.forEach(tx => {
   *   console.log(`Withdrawal on ${tx.date}: ${tx.amount} ${tx.token_type}`);
   * });
   * ```
   */
  public async getHistory(params: WithdrawalHistoryParams): Promise<TransactionHistoryResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Set defaults and validate limits
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/transactions?${queryParams.toString()}`;

    // Make API request
    const response = await this.httpClient.get<TransactionHistoryResponse>(url);

    // Filter for withdrawal transactions only
    const withdrawalTransactions = response.transactions.filter(
      (tx) => tx.action === TxAction.WITHDRAW
    );

    return {
      transactions: withdrawalTransactions,
      pagination: {
        ...response.pagination,
        total_items: withdrawalTransactions.length,
        total_pages: Math.ceil(withdrawalTransactions.length / limit),
      },
    };
  }

  /**
   * Get agent fees
   * 
   * Returns the fee information for the agent, including percentage and absolute amount.
   * 
   * @param params - Fee query parameters
   * @returns Fee information
   * 
   * @example
   * ```typescript
   * const fees = await agent.withdrawal.getFees({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log(`Fee: ${fees.percentage_fee * 100}% (${fees.fee} tokens)`);
   * ```
   */
  public async getFees(params: WithdrawalFeeParams): Promise<WithdrawalFeeResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/fee`;

    // Make API request
    const response = await this.httpClient.get<WithdrawalFeeResponse>(url);
    return response;
  }

  /**
   * Poll withdrawal status until deactivation is complete
   * 
   * Continuously polls the withdrawal status until the agent status becomes DEACTIVATED.
   * Useful for monitoring withdrawal progress after initiating a withdrawal request.
   * 
   * @param params - Status query parameters
   * @param options - Polling options (interval, timeout, callback)
   * @returns Final withdrawal status when deactivation is complete
   * @throws {TimeoutError} If polling exceeds the timeout duration
   * 
   * @example
   * ```typescript
   * // Poll with default options (5s interval, 5min timeout)
   * const finalStatus = await agent.withdrawal.pollStatus({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * 
   * // Poll with custom options and status updates
   * const finalStatus = await agent.withdrawal.pollStatus(
   *   { wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
   *   {
   *     interval: 3000,        // Poll every 3 seconds
   *     timeout: 600000,       // 10 minute timeout
   *     onUpdate: (status) => {
   *       console.log(`Current status: ${status}`);
   *     }
   *   }
   * );
   * ```
   */
  public async pollStatus(
    params: WithdrawalStatusParams,
    options?: PollStatusOptions
  ): Promise<WithdrawalStatusResponse> {
    // Validate wallet address first
    this.validateAddress(params.wallet, 'wallet address');

    // Set default options
    const interval = options?.interval || 5000; // 5 seconds
    const timeout = options?.timeout || 300000; // 5 minutes
    const onUpdate = options?.onUpdate;

    // Validate polling parameters
    if (interval <= 0) {
      throw new ValidationError('Polling interval must be greater than 0');
    }
    if (timeout <= 0) {
      throw new ValidationError('Polling timeout must be greater than 0');
    }

    const startTime = Date.now();

    while (true) {
      // Check if we've exceeded the timeout
      if (Date.now() - startTime > timeout) {
        throw new TimeoutError(timeout, 'Withdrawal status polling timed out');
      }

      // Get current status
      const statusResponse = await this.getStatus(params);

      // Call update callback if provided
      if (onUpdate) {
        onUpdate(statusResponse.status);
      }

      // Check if deactivation is complete
      if (statusResponse.status === AgentStatus.DEACTIVATED) {
        return statusResponse;
      }

      // Wait for the next poll interval
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

