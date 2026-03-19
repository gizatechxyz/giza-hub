import { HttpClient } from './http/client';
import { TimeoutError } from './http/errors';
import { ResolvedGizaConfig } from './types/config';
import { Address, ValidationError } from './types/common';
import {
  validateAddress,
  validatePositiveIntString,
  validateTxHash,
  validatePathSegment,
} from './validation';
import { Paginator, PaginatedResponse } from './paginator';
import {
  ActivateOptions,
  ActivateResponse,
  AprOptions,
  AgentInfo,
  AgentStatus,
  AprByTokenResponse,
  ConstraintConfig,
  DeactivateOptions,
  DeactivateResponse,
  DepositListResponse,
  ExecutionWithTransactionsDTO,
  FeeResponse,
  LimitResponse,
  LogDTO,
  PaginatedExecutionDTO,
  PaginatedLogDTO,
  PaginatedRewardDTO,
  PaginationOptions,
  PerformanceChartResponse,
  PerformanceOptions,
  Period,
  Protocol,
  RewardDTO,
  RunResponse,
  TopUpResponse,
  Transaction,
  TransactionHistoryResponse,
  WaitForDeactivationOptions,
  WalletAprResponse,
  WithdrawalStatusResponse,
  WithdrawResponse,
} from './types/agent';

/**
 * Agent resource bound to a specific smart-account wallet.
 *
 * All wallet-scoped operations use the wallet captured at
 * construction time, eliminating repetitive address passing.
 *
 * Obtain an Agent via `Giza.agent()`, `Giza.createAgent()`,
 * or `Giza.getAgent()`.
 */
export class Agent {
  public readonly wallet: Address;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: ResolvedGizaConfig,
    wallet: Address,
  ) {
    validateAddress(wallet, 'wallet address');
    this.wallet = wallet;
  }

  private get chain(): number {
    return this.config.chain;
  }

  // ================================================================
  // Lifecycle
  // ================================================================

  async activate(options: ActivateOptions): Promise<ActivateResponse> {
    validateAddress(options.owner, 'owner address');
    validateAddress(options.token, 'token address');

    if (!options.protocols || options.protocols.length === 0) {
      throw new ValidationError(
        'At least one protocol must be selected',
      );
    }

    return this.httpClient.post<ActivateResponse>(
      `/api/v1/${this.chain}/wallets`,
      {
        wallet: this.wallet,
        eoa: options.owner,
        initial_token: options.token,
        selected_protocols: options.protocols,
        tx_hash: options.txHash,
        constraints: options.constraints,
      },
    );
  }

  async deactivate(
    options?: DeactivateOptions,
  ): Promise<DeactivateResponse> {
    const transfer = options?.transfer ?? true;
    const params = new URLSearchParams({ transfer: String(transfer) });
    return this.httpClient.post<DeactivateResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}:deactivate?${params}`,
    );
  }

  async topUp(txHash: string): Promise<TopUpResponse> {
    if (!txHash) {
      throw new ValidationError('Transaction hash is required');
    }
    validateTxHash(txHash, 'transaction hash');
    const params = new URLSearchParams({ tx_hash: txHash });
    return this.httpClient.post<TopUpResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}:top-up?${params}`,
    );
  }

  async run(): Promise<RunResponse> {
    return this.httpClient.post<RunResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}:run`,
    );
  }

  // ================================================================
  // Performance & Portfolio
  // ================================================================

  async portfolio(): Promise<AgentInfo> {
    return this.httpClient.get<AgentInfo>(
      `/api/v1/${this.chain}/wallets/${this.wallet}`,
    );
  }

  async performance(
    options?: PerformanceOptions,
  ): Promise<PerformanceChartResponse> {
    const params = new URLSearchParams();
    if (options?.from) params.append('from_date', options.from);

    const qs = params.toString();
    const url =
      `/api/v1/${this.chain}/wallets/${this.wallet}/performance` +
      (qs ? `?${qs}` : '');

    return this.httpClient.get<PerformanceChartResponse>(url);
  }

  async apr(options?: AprOptions): Promise<WalletAprResponse> {
    const params = new URLSearchParams();
    if (options?.startDate) {
      params.append('start_date', options.startDate);
    }
    if (options?.endDate) {
      params.append('end_date', options.endDate);
    }
    if (options?.useExactEndDate !== undefined) {
      params.append(
        'use_exact_end_date',
        String(options.useExactEndDate),
      );
    }

    const qs = params.toString();
    const url =
      `/api/v1/${this.chain}/wallets/${this.wallet}/apr` +
      (qs ? `?${qs}` : '');

    return this.httpClient.get<WalletAprResponse>(url);
  }

  async aprByTokens(
    tokenPrice: number,
    period?: Period,
  ): Promise<AprByTokenResponse> {
    if (!Number.isFinite(tokenPrice) || tokenPrice <= 0) {
      throw new ValidationError(
        'tokenPrice must be a positive finite number',
      );
    }
    const params = new URLSearchParams();
    params.append('token_price', String(tokenPrice));
    if (period) params.append('period', period);

    const url =
      `/api/v1/${this.chain}/wallets/${this.wallet}/apr/tokens?${params}`;

    return this.httpClient.get<AprByTokenResponse>(url);
  }

  async deposits(): Promise<DepositListResponse> {
    return this.httpClient.get<DepositListResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/deposits`,
    );
  }

  // ================================================================
  // Paginated Collections
  // ================================================================

  transactions(options?: PaginationOptions): Paginator<Transaction> {
    return new Paginator(async (page, limit) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (options?.sort) params.append('sort', options.sort);

      const url =
        `/api/v1/${this.chain}/wallets/${this.wallet}` +
        `/transactions?${params}`;
      const res =
        await this.httpClient.get<TransactionHistoryResponse>(url);

      return {
        items: res.transactions,
        total: res.pagination.total_items,
        page: res.pagination.page,
        limit: res.pagination.items_per_page,
        hasMore: page < res.pagination.total_pages,
      };
    }, options?.limit ?? 20);
  }

  executions(
    options?: PaginationOptions,
  ): Paginator<ExecutionWithTransactionsDTO> {
    return new Paginator(async (page, limit) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (options?.sort) params.append('sort', options.sort);

      const url =
        `/api/v1/${this.chain}/wallets/${this.wallet}` +
        `/executions?${params}`;
      const res =
        await this.httpClient.get<PaginatedExecutionDTO>(url);

      return this.normalizePaginated(res, page, limit);
    }, options?.limit ?? 20);
  }

  executionLogs(
    executionId: string,
    options?: PaginationOptions,
  ): Paginator<LogDTO> {
    validatePathSegment(executionId, 'execution ID');
    return new Paginator(async (page, limit) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));

      const url =
        `/api/v1/${this.chain}/wallets/${this.wallet}` +
        `/executions/${executionId}/logs?${params}`;
      const res =
        await this.httpClient.get<PaginatedLogDTO>(url);

      return this.normalizePaginated(res, page, limit);
    }, options?.limit ?? 20);
  }

  logs(options?: PaginationOptions): Paginator<LogDTO> {
    return new Paginator(async (page, limit) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));

      const url =
        `/api/v1/${this.chain}/wallets/${this.wallet}` +
        `/logs?${params}`;
      const res =
        await this.httpClient.get<PaginatedLogDTO>(url);

      return this.normalizePaginated(res, page, limit);
    }, options?.limit ?? 20);
  }

  rewards(options?: PaginationOptions): Paginator<RewardDTO> {
    return new Paginator(async (page, limit) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (options?.sort) params.append('sort', options.sort);

      const url =
        `/api/v1/${this.chain}/rewards/${this.wallet}?${params}`;
      const res =
        await this.httpClient.get<PaginatedRewardDTO>(url);

      return this.normalizePaginated(res, page, limit);
    }, options?.limit ?? 20);
  }

  rewardHistory(options?: PaginationOptions): Paginator<RewardDTO> {
    return new Paginator(async (page, limit) => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (options?.sort) params.append('sort', options.sort);

      const url =
        `/api/v1/${this.chain}/rewards/${this.wallet}` +
        `/history?${params}`;
      const res =
        await this.httpClient.get<PaginatedRewardDTO>(url);

      return this.normalizePaginated(res, page, limit);
    }, options?.limit ?? 20);
  }

  // ================================================================
  // Withdrawal
  // ================================================================

  async withdraw(amount?: string): Promise<WithdrawResponse> {
    if (amount !== undefined) {
      validatePositiveIntString(amount, 'withdrawal amount');
      return this.httpClient.post<WithdrawResponse>(
        `/api/v1/${this.chain}/wallets/${this.wallet}:withdraw`,
        { amount: parseInt(amount, 10) },
      );
    }
    return this.httpClient.post<WithdrawResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}:deactivate?transfer=true`,
    );
  }

  async status(): Promise<WithdrawalStatusResponse> {
    const info = await this.httpClient.get<{
      wallet: string;
      status: AgentStatus;
      activation_date: string;
      last_deactivation_date?: string;
      last_reactivation_date?: string;
    }>(`/api/v1/${this.chain}/wallets/${this.wallet}`);

    validateAddress(info.wallet, 'API response wallet');
    return {
      status: info.status,
      wallet: info.wallet as Address,
      activation_date: info.activation_date,
      last_deactivation_date: info.last_deactivation_date,
      last_reactivation_date: info.last_reactivation_date,
    };
  }

  async waitForDeactivation(
    options?: WaitForDeactivationOptions,
  ): Promise<WithdrawalStatusResponse> {
    const interval = options?.interval ?? 5000;
    const timeout = options?.timeout ?? 300_000;
    const onUpdate = options?.onUpdate;

    if (interval <= 0) {
      throw new ValidationError(
        'Polling interval must be greater than 0',
      );
    }
    if (timeout <= 0) {
      throw new ValidationError(
        'Polling timeout must be greater than 0',
      );
    }

    const start = Date.now();
    while (true) {
      if (Date.now() - start > timeout) {
        throw new TimeoutError(
          timeout,
          'Withdrawal status polling timed out',
        );
      }

      const current = await this.status();
      if (onUpdate) onUpdate(current.status);
      if (current.status === AgentStatus.DEACTIVATED) return current;

      await new Promise((r) => setTimeout(r, interval));
    }
  }

  // ================================================================
  // Fees & Limits
  // ================================================================

  async fees(): Promise<FeeResponse> {
    return this.httpClient.get<FeeResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/fee`,
    );
  }

  async limit(eoa: Address): Promise<LimitResponse> {
    validateAddress(eoa, 'origin wallet address');
    const params = new URLSearchParams({ eoa });
    return this.httpClient.get<LimitResponse>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/limit?${params}`,
    );
  }

  // ================================================================
  // Protocols
  // ================================================================

  async protocols(): Promise<Protocol[]> {
    return this.httpClient.get<Protocol[]>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/protocols`,
    );
  }

  async updateProtocols(protocols: string[]): Promise<void> {
    if (!protocols || protocols.length === 0) {
      throw new ValidationError(
        'At least one protocol must be provided',
      );
    }
    await this.httpClient.put<void>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/protocols`,
      protocols,
    );
  }

  // ================================================================
  // Constraints
  // ================================================================

  async constraints(): Promise<ConstraintConfig[]> {
    return this.httpClient.get<ConstraintConfig[]>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/constraints`,
    );
  }

  async updateConstraints(
    constraints: ConstraintConfig[],
  ): Promise<void> {
    await this.httpClient.put<void>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/constraints`,
      { constraints },
    );
  }

  // ================================================================
  // Whitelist
  // ================================================================

  async whitelist(): Promise<unknown> {
    return this.httpClient.get<unknown>(
      `/api/v1/${this.chain}/wallets/${this.wallet}/whitelist`,
    );
  }

  // ================================================================
  // Private Helpers
  // ================================================================

  private normalizePaginated<T>(
    res: { items: T[]; total: number },
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    return {
      items: res.items,
      total: res.total,
      page,
      limit,
      hasMore: page * limit < res.total,
    };
  }
}
