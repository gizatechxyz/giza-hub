import { HttpClient } from '../http/client';
import { TimeoutError } from '../http/errors';
import { ResolvedGizaAgentConfig } from '../types/config';
import { Address, NotImplementedError, ValidationError } from '../types/common';
import { ADDRESS_REGEX } from '../constants';
import {
  CreateSmartAccountParams,
  GetSmartAccountParams,
  SmartAccountInfo,
  ZerodevSmartWalletResponse,
  ProtocolsResponse,
  ActivateParams,
  ActivateResponse,
  DeactivateParams,
  DeactivateResponse,
  TopUpParams,
  TopUpResponse,
  RunParams,
  RunResponse,
  GetPerformanceParams,
  PerformanceChartResponse,
  GetPortfolioParams,
  AgentInfo,
  GetAPRParams,
  WalletAprResponse,
  GetTransactionsParams,
  TransactionHistoryResponse,
  TxAction,
  WithdrawParams,
  WithdrawResponse,
  WithdrawalStatusResponse,
  PollWithdrawalStatusOptions,
  AgentStatus,
  FeeResponse,
  GetLimitParams,
  LimitResponse,
  ClaimedRewardsResponse,
  DepositListResponse,
} from '../types/agent';

/**
 * Agent Module
 * 
 * Provides all agent operations through a single interface:
 * - Smart account creation and management
 * - Protocol selection and configuration
 * - Agent lifecycle (activate, deactivate, run, topUp)
 * - Performance monitoring and history
 * - Withdrawal operations
 * - Rewards claiming
 */
export class AgentModule {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: ResolvedGizaAgentConfig
  ) {}

  // ============================================================================
  // Validation Helpers
  // ============================================================================

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

  // ============================================================================
  // Smart Account Operations
  // ============================================================================

  /**
   * Create a new smart account for a user
   * 
   * @param params - Creation parameters including origin wallet address
   * @returns Smart account information including the new smart account address
   * 
   * @example
   * ```typescript
   * const account = await giza.agent.createSmartAccount({
   *   origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log('Deposit to:', account.smartAccountAddress);
   * ```
   */
  public async createSmartAccount(params: CreateSmartAccountParams): Promise<SmartAccountInfo> {
    this.validateAddress(params.origin_wallet, 'origin wallet address');

    const requestBody = {
      eoa: params.origin_wallet,
      chain: this.config.chainId,
      agent_id: this.config.agentId,
    };

    const response = await this.httpClient.post<ZerodevSmartWalletResponse>(
      '/api/v1/proxy/zerodev/smart-accounts',
      requestBody
    );

    return {
      smartAccountAddress: response.smartAccount as Address,
      backendWallet: response.backendWallet as Address,
      origin_wallet: params.origin_wallet,
      chain: this.config.chainId,
    };
  }

  /**
   * Get smart account information
   * 
   * @param params - Query parameters (origin wallet required)
   * @returns Smart account information
   * 
   * @example
   * ```typescript
   * const info = await giza.agent.getSmartAccount({
   *   origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * ```
   */
  public async getSmartAccount(params: GetSmartAccountParams): Promise<SmartAccountInfo> {
    if (!params.smartAccount && !params.origin_wallet) {
      throw new ValidationError('Either smartAccount or origin_wallet must be provided');
    }

    if (params.smartAccount && !params.origin_wallet) {
      throw new NotImplementedError(
        'Looking up smart account by address alone is not yet supported. ' +
        'Please provide the origin_wallet address instead.'
      );
    }

    if (params.origin_wallet) {
      this.validateAddress(params.origin_wallet, 'origin wallet address');
    }

    const queryParams = new URLSearchParams({
      chain: this.config.chainId.toString(),
      eoa: params.origin_wallet!,
      agent_id: this.config.agentId,
    });

    const response = await this.httpClient.get<ZerodevSmartWalletResponse>(
      `/api/v1/proxy/zerodev/smart-accounts?${queryParams.toString()}`
    );

    return {
      smartAccountAddress: response.smartAccount as Address,
      backendWallet: response.backendWallet as Address,
      origin_wallet: params.origin_wallet!,
      chain: this.config.chainId,
    };
  }

  // ============================================================================
  // Protocol Operations
  // ============================================================================

  /**
   * Get available protocols for a token
   * 
   * @param tokenAddress - The token address to get protocols for
   * @returns List of available protocol names
   * 
   * @example
   * ```typescript
   * const { protocols } = await giza.agent.getProtocols(USDC_ADDRESS);
   * console.log('Available protocols:', protocols);
   * ```
   */
  public async getProtocols(tokenAddress: Address): Promise<ProtocolsResponse> {
    this.validateAddress(tokenAddress, 'token address');

    const response = await this.httpClient.get<ProtocolsResponse>(
      `/api/v1/protocols/${this.config.chainId}/${tokenAddress}/protocols`
    );

    return response;
  }

  /**
   * Update selected protocols for an agent
   * 
   * @param wallet - Smart account wallet address
   * @param protocols - List of protocol names to use
   * 
   * @example
   * ```typescript
   * await giza.agent.updateProtocols(
   *   smartAccountAddress,
   *   ['aave', 'compound', 'morpho']
   * );
   * ```
   */
  public async updateProtocols(wallet: Address, protocols: string[]): Promise<void> {
    this.validateAddress(wallet, 'wallet address');

    if (!protocols || protocols.length === 0) {
      throw new ValidationError('At least one protocol must be provided');
    }

    await this.httpClient.put<void>(
      `/api/v1/agents/${this.config.chainId}/wallets/${wallet}/protocols`,
      protocols
    );
  }

  // ============================================================================
  // Agent Lifecycle Operations
  // ============================================================================

  /**
   * Activate an agent after the user has deposited funds
   * 
   * @param params - Activation parameters
   * @returns Activation response with confirmation message
   * 
   * @example
   * ```typescript
   * await giza.agent.activate({
   *   wallet: smartAccountAddress,
   *   origin_wallet: userWallet,
   *   initial_token: USDC_ADDRESS,
   *   selected_protocols: ['aave', 'compound'],
   *   tx_hash: depositTxHash,
   * });
   * ```
   */
  public async activate(params: ActivateParams): Promise<ActivateResponse> {
    this.validateAddress(params.wallet, 'wallet address');
    this.validateAddress(params.origin_wallet, 'origin wallet address');
    this.validateAddress(params.initial_token, 'initial token address');

    if (!params.selected_protocols || params.selected_protocols.length === 0) {
      throw new ValidationError('At least one protocol must be selected');
    }

    const requestBody = {
      wallet: params.wallet,
      eoa: params.origin_wallet,
      initial_token: params.initial_token,
      selected_protocols: params.selected_protocols,
      tx_hash: params.tx_hash,
      constraints: params.constraints,
    };

    const response = await this.httpClient.post<ActivateResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets`,
      requestBody
    );

    return response;
  }

  /**
   * Deactivate an agent
   * 
   * @param params - Deactivation parameters
   * @returns Deactivation response
   * 
   * @example
   * ```typescript
   * await giza.agent.deactivate({
   *   wallet: smartAccountAddress,
   *   transfer: true, // Transfer remaining balance to origin wallet
   * });
   * ```
   */
  public async deactivate(params: DeactivateParams): Promise<DeactivateResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    const transfer = params.transfer !== undefined ? params.transfer : true;
    const queryParams = new URLSearchParams({
      transfer: transfer.toString(),
    });

    const response = await this.httpClient.post<DeactivateResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}:deactivate?${queryParams.toString()}`
    );

    return response;
  }

  /**
   * Top up an active agent with additional funds
   * 
   * @param params - Top-up parameters including wallet and transaction hash
   * @returns Top-up response
   * 
   * @example
   * ```typescript
   * await giza.agent.topUp({
   *   wallet: smartAccountAddress,
   *   tx_hash: depositTxHash,
   * });
   * ```
   */
  public async topUp(params: TopUpParams): Promise<TopUpResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    if (!params.tx_hash) {
      throw new ValidationError('Transaction hash is required');
    }

    const queryParams = new URLSearchParams({
      tx_hash: params.tx_hash,
    });

    const response = await this.httpClient.post<TopUpResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}:top-up?${queryParams.toString()}`
    );

    return response;
  }

  /**
   * Trigger an agent run manually
   * 
   * @param params - Run parameters
   * @returns Run response
   * 
   * @example
   * ```typescript
   * const result = await giza.agent.run({ wallet: smartAccountAddress });
   * console.log(result.status);
   * ```
   */
  public async run(params: RunParams): Promise<RunResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    const response = await this.httpClient.post<RunResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}:run`
    );

    return response;
  }

  // ============================================================================
  // Performance & Portfolio Operations
  // ============================================================================

  /**
   * Get performance chart data for an agent
   * 
   * @param params - Performance query parameters
   * @returns Performance chart data with historical values
   * 
   * @example
   * ```typescript
   * const performance = await giza.agent.getPerformance({
   *   wallet: smartAccountAddress,
   *   from_date: '2024-01-01 00:00:00',
   * });
   * ```
   */
  public async getPerformance(params: GetPerformanceParams): Promise<PerformanceChartResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    const queryParams = new URLSearchParams();
    if (params.from_date) {
      queryParams.append('from_date', params.from_date);
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/performance${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await this.httpClient.get<PerformanceChartResponse>(url);
    return response;
  }

  /**
   * Get portfolio and agent information
   * 
   * @param params - Portfolio query parameters
   * @returns Agent information including deposits, withdrawals, and status
   * 
   * @example
   * ```typescript
   * const portfolio = await giza.agent.getPortfolio({
   *   wallet: smartAccountAddress,
   * });
   * console.log('Status:', portfolio.status);
   * console.log('Deposits:', portfolio.deposits);
   * ```
   */
  public async getPortfolio(params: GetPortfolioParams): Promise<AgentInfo> {
    this.validateAddress(params.wallet, 'wallet address');

    const queryParams = new URLSearchParams();
    if (params.is_origin_wallet !== undefined) {
      queryParams.append('eoa', params.is_origin_wallet.toString());
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await this.httpClient.get<AgentInfo>(url);
    return response;
  }

  /**
   * Get APR (Annual Percentage Rate) for an agent
   * 
   * @param params - APR query parameters
   * @returns APR data with optional sub-period breakdown
   * 
   * @example
   * ```typescript
   * const aprData = await giza.agent.getAPR({
   *   wallet: smartAccountAddress,
   *   start_date: '2024-01-01T00:00:00Z',
   * });
   * console.log(`APR: ${aprData.apr}%`);
   * ```
   */
  public async getAPR(params: GetAPRParams): Promise<WalletAprResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    const queryParams = new URLSearchParams();
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params.use_exact_end_date !== undefined) {
      queryParams.append('use_exact_end_date', params.use_exact_end_date.toString());
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/apr${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await this.httpClient.get<WalletAprResponse>(url);
    return response;
  }

  /**
   * Get deposits for an agent
   * 
   * @param wallet - Smart account wallet address
   * @param isOriginWallet - Whether the wallet is an origin wallet
   * @returns List of deposits
   * 
   * @example
   * ```typescript
   * const deposits = await giza.agent.getDeposits(smartAccountAddress);
   * ```
   */
  public async getDeposits(wallet: Address, isOriginWallet = false): Promise<DepositListResponse> {
    this.validateAddress(wallet, 'wallet address');

    const queryParams = new URLSearchParams();
    if (isOriginWallet) {
      queryParams.append('eoa', 'true');
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${wallet}/deposits${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await this.httpClient.get<DepositListResponse>(url);
    return response;
  }

  // ============================================================================
  // Transaction History Operations
  // ============================================================================

  /**
   * Get transaction history for an agent
   * 
   * @param params - Transaction query parameters
   * @returns Transaction history with pagination
   * 
   * @example
   * ```typescript
   * const history = await giza.agent.getTransactions({
   *   wallet: smartAccountAddress,
   *   page: 1,
   *   limit: 20,
   *   sort: SortOrder.DATE_DESC,
   * });
   * ```
   */
  public async getTransactions(params: GetTransactionsParams): Promise<TransactionHistoryResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    const queryParams = new URLSearchParams();
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);

    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/transactions?${queryParams.toString()}`;

    const response = await this.httpClient.get<TransactionHistoryResponse>(url);
    return response;
  }

  /**
   * Get withdrawal history for an agent
   * 
   * Filters transaction history to show only withdrawal transactions.
   * 
   * @param wallet - Smart account wallet address
   * @param page - Page number (starts at 1)
   * @param limit - Number of items per page (max 100)
   * @returns Withdrawal transaction history
   * 
   * @example
   * ```typescript
   * const withdrawals = await giza.agent.getWithdrawalHistory(smartAccountAddress);
   * ```
   */
  public async getWithdrawalHistory(
    wallet: Address,
    page = 1,
    limit = 20
  ): Promise<TransactionHistoryResponse> {
    const response = await this.getTransactions({
      wallet,
      page,
      limit,
    });

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

  // ============================================================================
  // Withdrawal Operations
  // ============================================================================

  /**
   * Request a withdrawal from an agent
   * 
   * Supports both partial and full withdrawal:
   * - Partial: Specify `amount` to withdraw a specific amount (agent remains active)
   * - Full: Omit `amount` to withdraw everything and deactivate the agent
   * 
   * @param params - Withdrawal parameters
   * @returns Withdrawal response
   * 
   * @example
   * ```typescript
   * // Partial withdrawal - withdraw 1000 USDC (6 decimals), agent stays active
   * const result = await giza.agent.withdraw({
   *   wallet: smartAccountAddress,
   *   amount: '1000000000', // 1000 USDC in smallest unit
   * });
   * 
   * // Full withdrawal - withdraw everything and deactivate agent
   * await giza.agent.withdraw({
   *   wallet: smartAccountAddress,
   *   transfer: true,
   * });
   * ```
   */
  public async withdraw(params: WithdrawParams): Promise<WithdrawResponse> {
    this.validateAddress(params.wallet, 'wallet address');

    // If amount is specified, do partial withdrawal
    if (params.amount !== undefined) {
      return this.partialWithdraw(params.wallet, params.amount);
    }

    // Otherwise, do full withdrawal (deactivate)
    return this.fullWithdraw(params.wallet, params.transfer);
  }

  /**
   * Execute a partial withdrawal (agent remains active)
   * @internal
   */
  private async partialWithdraw(
    wallet: Address,
    amount: string
  ): Promise<WithdrawResponse> {
    const response = await this.httpClient.post<WithdrawResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets/${wallet}:withdraw`,
      { amount: parseInt(amount, 10) }
    );

    return response;
  }

  /**
   * Execute a full withdrawal (deactivates the agent)
   * @internal
   */
  private async fullWithdraw(
    wallet: Address,
    transfer?: boolean
  ): Promise<WithdrawResponse> {
    const transferValue = transfer !== undefined ? transfer : true;
    const queryParams = new URLSearchParams({
      transfer: transferValue.toString(),
    });

    const response = await this.httpClient.post<WithdrawResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets/${wallet}:deactivate?${queryParams.toString()}`
    );

    return response;
  }

  /**
   * Get withdrawal/deactivation status
   * 
   * @param wallet - Smart account wallet address
   * @returns Current status of the agent
   * 
   * @example
   * ```typescript
   * const status = await giza.agent.getWithdrawalStatus(smartAccountAddress);
   * console.log('Status:', status.status);
   * ```
   */
  public async getWithdrawalStatus(wallet: Address): Promise<WithdrawalStatusResponse> {
    this.validateAddress(wallet, 'wallet address');

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${wallet}`;

    const agentInfo = await this.httpClient.get<{
      wallet: string;
      status: AgentStatus;
      activation_date: string;
      last_deactivation_date?: string;
      last_reactivation_date?: string;
    }>(url);

    return {
      status: agentInfo.status,
      wallet: agentInfo.wallet as Address,
      activation_date: agentInfo.activation_date,
      last_deactivation_date: agentInfo.last_deactivation_date,
      last_reactivation_date: agentInfo.last_reactivation_date,
    };
  }

  /**
   * Poll withdrawal status until complete
   * 
   * @param wallet - Smart account wallet address
   * @param options - Polling options
   * @returns Final withdrawal status when deactivation is complete
   * @throws {TimeoutError} If polling exceeds the timeout duration
   * 
   * @example
   * ```typescript
   * const finalStatus = await giza.agent.pollWithdrawalStatus(
   *   smartAccountAddress,
   *   {
   *     interval: 5000,
   *     timeout: 300000,
   *     onUpdate: (status) => console.log('Status:', status),
   *   }
   * );
   * ```
   */
  public async pollWithdrawalStatus(
    wallet: Address,
    options?: PollWithdrawalStatusOptions
  ): Promise<WithdrawalStatusResponse> {
    this.validateAddress(wallet, 'wallet address');

    const interval = options?.interval || 5000;
    const timeout = options?.timeout || 300000;
    const onUpdate = options?.onUpdate;

    if (interval <= 0) {
      throw new ValidationError('Polling interval must be greater than 0');
    }
    if (timeout <= 0) {
      throw new ValidationError('Polling timeout must be greater than 0');
    }

    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new TimeoutError(timeout, 'Withdrawal status polling timed out');
      }

      const statusResponse = await this.getWithdrawalStatus(wallet);

      if (onUpdate) {
        onUpdate(statusResponse.status);
      }

      if (statusResponse.status === AgentStatus.DEACTIVATED) {
        return statusResponse;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  // ============================================================================
  // Fee Operations
  // ============================================================================

  /**
   * Get fee information for an agent
   * 
   * @param wallet - Smart account wallet address
   * @returns Fee information
   * 
   * @example
   * ```typescript
   * const fees = await giza.agent.getFees(smartAccountAddress);
   * console.log(`Fee: ${fees.percentage_fee * 100}%`);
   * ```
   */
  public async getFees(wallet: Address): Promise<FeeResponse> {
    this.validateAddress(wallet, 'wallet address');

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${wallet}/fee`;

    const response = await this.httpClient.get<FeeResponse>(url);
    return response;
  }

  // ============================================================================
  // Limit Operations
  // ============================================================================

  /**
   * Get deposit limit for an agent
   * 
   * @param params - Limit query parameters
   * @returns Deposit limit information
   * 
   * @example
   * ```typescript
   * const { limit } = await giza.agent.getLimit({
   *   wallet: smartAccountAddress,
   *   origin_wallet: userWallet,
   * });
   * console.log('Deposit limit:', limit);
   * ```
   */
  public async getLimit(params: GetLimitParams): Promise<LimitResponse> {
    this.validateAddress(params.wallet, 'wallet address');
    this.validateAddress(params.origin_wallet, 'origin wallet address');

    const queryParams = new URLSearchParams({
      eoa: params.origin_wallet,
    });

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/limit?${queryParams.toString()}`;

    const response = await this.httpClient.get<LimitResponse>(url);
    return response;
  }

  // ============================================================================
  // Rewards Operations
  // ============================================================================

  /**
   * Claim accrued rewards for an agent
   * 
   * @param wallet - Smart account wallet address
   * @returns Claimed rewards information
   * 
   * @example
   * ```typescript
   * const rewards = await giza.agent.claimRewards(smartAccountAddress);
   * rewards.rewards.forEach(r => {
   *   console.log(`Claimed ${r.amount_float} of ${r.token}`);
   * });
   * ```
   */
  public async claimRewards(wallet: Address): Promise<ClaimedRewardsResponse> {
    this.validateAddress(wallet, 'wallet address');

    const response = await this.httpClient.post<ClaimedRewardsResponse>(
      `/api/v1/agents/${this.config.chainId}/wallets/${wallet}:claim-rewards`
    );

    return response;
  }
}

