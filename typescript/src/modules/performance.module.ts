import { HttpClient } from '../http/client';
import { ResolvedGizaAgentConfig } from '../types/config';
import { ValidationError } from '../types/common';
import { ADDRESS_REGEX } from '../constants';
import {
  GetChartParams,
  GetPortfolioParams,
  GetTransactionsParams,
  GetAPRParams,
  PerformanceChartResponse,
  AgentInfo,
  TransactionHistoryResponse,
  WalletAprResponse,
} from '../types/performance';

/**
 * Performance Module
 * Handles agent performance tracking and analytics
 */
export class PerformanceModule {
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
   * Get performance chart data for a wallet
   * 
   * Retrieves historical performance data including value over time,
   * token distribution, accrued rewards, and portfolio allocation.
   * 
   * @param params - Chart query parameters
   * @returns Performance chart data with time series
   * 
   * @example
   * ```typescript
   * const chartData = await agent.performance.getChart({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
   *   from_date: '2024-01-01 00:00:00'
   * });
   * console.log(chartData.performance);
   * ```
   */
  public async getChart(params: GetChartParams): Promise<PerformanceChartResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.from_date) {
      queryParams.append('from_date', params.from_date);
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/performance${
      queryString ? `?${queryString}` : ''
    }`;

    // Make API request
    const response = await this.httpClient.get<PerformanceChartResponse>(url);
    return response;
  }

  /**
   * Get portfolio and agent information for a wallet
   * 
   * Retrieves wallet information including deposits,
   * withdrawals, status, selected protocols, and current allocations.
   * 
   * @param params - Portfolio query parameters
   * @returns Agent information including portfolio details
   * 
   * @example
   * ```typescript
   * const portfolio = await agent.performance.getPortfolio({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log(portfolio.status, portfolio.deposits);
   * ```
   */
  public async getPortfolio(params: GetPortfolioParams): Promise<AgentInfo> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.origin_wallet !== undefined) {
      queryParams.append('eoa', params.origin_wallet.toString());
    }

    const queryString = queryParams.toString();
    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}${
      queryString ? `?${queryString}` : ''
    }`;

    // Make API request
    const response = await this.httpClient.get<AgentInfo>(url);
    return response;
  }

  /**
   * Get transaction history for a wallet
   * 
   * Retrieves paginated transaction history including deposits, withdrawals,
   * supplies, swaps, and claims with their status and details.
   * 
   * @param params - Transaction query parameters
   * @returns Transaction history with pagination info
   * 
   * @example
   * ```typescript
   * const txHistory = await agent.performance.getTransactions({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
   *   page: 1,
   *   limit: 20,
   *   sort: SortOrder.DATE_DESC
   * });
   * console.log(txHistory.transactions, txHistory.pagination);
   * ```
   */
  public async getTransactions(
    params: GetTransactionsParams
  ): Promise<TransactionHistoryResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Set defaults and validate limits
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    const url = `/api/v1/agents/${this.config.chainId}/wallets/${params.wallet}/transactions?${queryParams.toString()}`;

    // Make API request
    const response = await this.httpClient.get<TransactionHistoryResponse>(url);
    return response;
  }

  /**
   * Get APR (Annual Percentage Rate) for a wallet
   * 
   * Calculates the APR for a wallet over a specified time period.
   * Can include detailed sub-period breakdown.
   * 
   * @param params - APR query parameters
   * @returns APR data with optional sub-period details
   * 
   * @example
   * ```typescript
   * // Get current APR
   * const aprData = await agent.performance.getAPR({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log(`APR: ${aprData.apr}%`);
   * 
   * // Get APR for specific date range
   * const rangeApr = await agent.performance.getAPR({
   *   wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
   *   start_date: '2024-01-01T00:00:00Z',
   *   end_date: '2024-12-31T23:59:59Z',
   *   use_exact_end_date: true
   * });
   * ```
   */
  public async getAPR(params: GetAPRParams): Promise<WalletAprResponse> {
    // Validate wallet address
    this.validateAddress(params.wallet, 'wallet address');

    // Build query parameters
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

    // Make API request
    const response = await this.httpClient.get<WalletAprResponse>(url);
    return response;
  }
}

