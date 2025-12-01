import { HttpClient } from '../http/client';
import { ResolvedGizaAgentConfig } from '../types/config';
import {
  CreateSmartAccountParams,
  GetSmartAccountParams,
  UpdatePermissionsParams,
  SmartAccountInfo,
  ZerodevSmartWalletResponse,
} from '../types/smart-account';
import { Address, NotImplementedError, ValidationError } from '../types/common';
import { ADDRESS_REGEX } from '../constants';

/**
 * Smart Account Module
 * Handles ZeroDev smart account creation and management
 */
export class SmartAccountModule {
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
   * Create a new ZeroDev smart account with session keys and permissions
   * 
   * @param params - Creation parameters
   * @returns Smart account information
   * 
   * @example
   * ```typescript
   * const account = await agent.smartAccount.create({
   *   origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * console.log(account.smartAccountAddress);
   * ```
   */
  public async create(params: CreateSmartAccountParams): Promise<SmartAccountInfo> {
    // Validate origin wallet address
    this.validateAddress(params.origin_wallet, 'origin wallet address');

    const requestBody = {
      eoa: params.origin_wallet,
      chain: this.config.chainId,
      agent_id: this.config.agentId,
    };

    // Make API request
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
   * Get smart account details and session key status
   * 
   * Note: Currently only supports lookup by origin wallet address.
   * TODO: Implement lookup by smart account address
   * 
   * @param params - Query parameters (origin wallet required)
   * @returns Smart account information
   * 
   * @throws {NotImplementedError} If only smartAccount is provided without origin wallet
   * @throws {ValidationError} If no parameters are provided
   * 
   * @example
   * ```typescript
   * const info = await agent.smartAccount.getInfo({
   *   origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
   * });
   * ```
   */
  public async getInfo(params: GetSmartAccountParams): Promise<SmartAccountInfo> {
    // Validate at least one parameter is provided
    if (!params.smartAccount && !params.origin_wallet) {
      throw new ValidationError('Either smartAccount or origin wallet must be provided');
    }

    // If only smartAccount is provided, throw not implemented error
    if (params.smartAccount && !params.origin_wallet) {
      throw new NotImplementedError(
        'Looking up smart account by address alone is not yet supported. ' +
          'Please provide the origin wallet address instead. '       
        );
    }

    // Validate origin wallet if provided
    if (params.origin_wallet) {
      this.validateAddress(params.origin_wallet, 'origin wallet address');
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      chain: this.config.chainId.toString(),
      eoa: params.origin_wallet!,
      agent_id: this.config.agentId,
    });

    // Make API request
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

  /**
   * Update session key permissions for a smart account
   * 
   * This feature is not yet available.
   * TODO: Implement permission updates.
   * 
   * @param params - Update parameters
   * @throws {NotImplementedError} Always throws - feature not yet available
   * 
   * @example
   * ```typescript
   * // This will throw NotImplementedError
   * await agent.smartAccount.updatePermissions({
   *   smartAccount: '0x...',
   * });
   * ```
   */
  public async updatePermissions(
    params: UpdatePermissionsParams
  ): Promise<SmartAccountInfo> {
    // Validate smart account address
    this.validateAddress(params.smartAccount, 'Smart account address');

    throw new NotImplementedError(
      'Permission updates are not yet available. ' 
    );
  }
}

