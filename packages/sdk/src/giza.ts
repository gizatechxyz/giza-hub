import { HttpClient } from './http/client';
import { PartnerAuth } from './auth/partner-auth';
import { Agent } from './agent';
import { GizaConfig, ResolvedGizaConfig } from './types/config';
import { Address, Chain, ValidationError } from './types/common';
import { DEFAULT_AGENT_ID, DEFAULT_TIMEOUT } from './constants';
import {
  validateAddress,
  validateChainId,
  validatePositiveIntString,
  validateNonNegativeIntString,
} from './validation';
import {
  ChainsResponse,
  GlobalConfigResponse,
  HealthcheckResponse,
  ProtocolsRawResponse,
  ProtocolsResponse,
  ProtocolsSupplyResponse,
  SmartAccountInfo,
  Statistics,
  TokensResponse,
  TVLResponse,
  ZerodevSmartWalletResponse,
} from './types/agent';
import {
  OptimizeOptions,
  OptimizeRequest,
  OptimizeResponse,
  SimulateOptions,
  SimulationRequest,
  SimulationResponse,
} from './types/optimizer';

/**
 * Main Giza SDK client.
 *
 * @example
 * ```typescript
 * import { Giza, Chain } from '@gizatech/agent-sdk';
 *
 * const giza = new Giza({
 *   chain: Chain.BASE,
 *   apiKey: 'key',
 *   partner: 'name',
 * });
 *
 * const agent = await giza.createAgent('0xEOA...');
 * await agent.activate({ ... });
 * const perf = await agent.performance();
 * ```
 */
export class Giza {
  private readonly config: ResolvedGizaConfig;
  private readonly httpClient: HttpClient;

  constructor(config: GizaConfig) {
    this.config = this.resolveConfig(config);

    const auth = new PartnerAuth(
      this.config.apiKey,
      this.config.partner,
    );

    this.httpClient = new HttpClient({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      enableRetry: this.config.enableRetry,
      headers: auth.getHeaders(),
    });
  }

  // ================================================================
  // Agent Factory
  // ================================================================

  /**
   * Create an Agent handle without making an API call.
   * Use this when you already know the smart-account address.
   */
  agent(wallet: Address): Agent {
    return new Agent(this.httpClient, this.config, wallet);
  }

  /**
   * Create a new smart account and return an Agent bound to it.
   */
  async createAgent(eoa: Address): Promise<Agent> {
    validateAddress(eoa, 'origin wallet address');

    const res =
      await this.httpClient.post<ZerodevSmartWalletResponse>(
        '/api/v1/proxy/zerodev/smart-accounts',
        {
          eoa,
          chain: this.config.chain,
          agent_id: this.config.agentId,
        },
      );

    return new Agent(
      this.httpClient,
      this.config,
      res.smartAccount as Address,
    );
  }

  /**
   * Look up an existing smart account by EOA and return an Agent.
   */
  async getAgent(eoa: Address): Promise<Agent> {
    validateAddress(eoa, 'origin wallet address');

    const params = new URLSearchParams({
      chain: String(this.config.chain),
      eoa,
      agent_id: this.config.agentId,
    });

    const res =
      await this.httpClient.get<ZerodevSmartWalletResponse>(
        `/api/v1/proxy/zerodev/smart-accounts?${params}`,
      );

    return new Agent(
      this.httpClient,
      this.config,
      res.smartAccount as Address,
    );
  }

  /**
   * Get full smart account info (address, backend wallet, etc.)
   * for a given EOA.
   */
  async getSmartAccount(eoa: Address): Promise<SmartAccountInfo> {
    validateAddress(eoa, 'origin wallet address');

    const params = new URLSearchParams({
      chain: String(this.config.chain),
      eoa,
      agent_id: this.config.agentId,
    });

    const res =
      await this.httpClient.get<ZerodevSmartWalletResponse>(
        `/api/v1/proxy/zerodev/smart-accounts?${params}`,
      );

    return {
      smartAccountAddress: res.smartAccount as Address,
      backendWallet: res.backendWallet as Address,
      origin_wallet: eoa,
      chain: this.config.chain,
    };
  }

  // ================================================================
  // Chain-Level Queries
  // ================================================================

  async protocols(token: Address): Promise<ProtocolsResponse> {
    validateAddress(token, 'token address');

    const raw =
      await this.httpClient.get<ProtocolsRawResponse>(
        `/api/v1/${this.config.chain}/${token}/protocols`,
      );

    return {
      protocols: raw.protocols
        .filter((p) => p.is_active)
        .map((p) => p.name),
    };
  }

  async protocolSupply(
    token: Address,
  ): Promise<ProtocolsSupplyResponse> {
    validateAddress(token, 'token address');
    return this.httpClient.get<ProtocolsSupplyResponse>(
      `/api/v1/${this.config.chain}/${token}/protocols/supply`,
    );
  }

  async tokens(): Promise<TokensResponse> {
    return this.httpClient.get<TokensResponse>(
      `/api/v1/${this.config.chain}/tokens`,
    );
  }

  async stats(): Promise<Statistics> {
    return this.httpClient.get<Statistics>(
      `/api/v1/${this.config.chain}/stats`,
    );
  }

  async tvl(): Promise<TVLResponse> {
    return this.httpClient.get<TVLResponse>(
      `/api/v1/${this.config.chain}/tvl`,
    );
  }

  // ================================================================
  // Optimizer
  // ================================================================

  async optimize(options: OptimizeOptions): Promise<OptimizeResponse> {
    const chain = options.chain ?? this.config.chain;
    validateChainId(chain);
    validateAddress(options.token, 'token address');
    validatePositiveIntString(options.capital, 'capital');

    if (!options.protocols || options.protocols.length === 0) {
      throw new ValidationError(
        'At least one protocol must be provided',
      );
    }

    if (
      !options.currentAllocations ||
      typeof options.currentAllocations !== 'object'
    ) {
      throw new ValidationError(
        'currentAllocations must be an object',
      );
    }

    for (const [protocol, amount] of Object.entries(
      options.currentAllocations,
    )) {
      validateNonNegativeIntString(
        amount,
        `currentAllocations.${protocol}`,
      );
    }

    if (options.wallet) {
      validateAddress(options.wallet, 'wallet');
    }

    const body: OptimizeRequest = {
      total_capital: options.capital,
      token_address: options.token,
      current_allocations: options.currentAllocations,
      protocols: options.protocols,
      constraints: options.constraints,
      wallet_address: options.wallet,
    };

    return this.httpClient.post<OptimizeResponse>(
      `/api/v1/optimizer/${chain}/optimize`,
      body,
    );
  }

  async simulate(
    options: SimulateOptions,
  ): Promise<SimulationResponse> {
    const chain = options.chain ?? this.config.chain;
    validateChainId(chain);

    const body: SimulationRequest = {
      token_address: options.token,
      balance: options.balance,
      protocol_names: options.protocols,
      constraints: options.constraints,
    };

    return this.httpClient.post<SimulationResponse>(
      `/api/v1/${chain}/simulation`,
      body,
    );
  }

  // ================================================================
  // System
  // ================================================================

  async health(): Promise<HealthcheckResponse> {
    return this.httpClient.get<HealthcheckResponse>('/healthcheck');
  }

  async getApiConfig(): Promise<GlobalConfigResponse> {
    return this.httpClient.get<GlobalConfigResponse>('/config');
  }

  async chains(): Promise<ChainsResponse> {
    return this.httpClient.get<ChainsResponse>('/chains');
  }

  // ================================================================
  // Accessors
  // ================================================================

  getChain(): Chain {
    return this.config.chain;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  // ================================================================
  // Private
  // ================================================================

  private resolveConfig(config: GizaConfig): ResolvedGizaConfig {
    const apiKey =
      config.apiKey ?? process.env.GIZA_API_KEY;
    if (!apiKey) {
      throw new ValidationError(
        'API key is required. Pass apiKey in config or ' +
          'set GIZA_API_KEY environment variable.',
      );
    }

    const partner =
      config.partner ?? process.env.GIZA_PARTNER_NAME;
    if (!partner) {
      throw new ValidationError(
        'Partner name is required. Pass partner in config or ' +
          'set GIZA_PARTNER_NAME environment variable.',
      );
    }

    const apiUrl =
      config.apiUrl ?? process.env.GIZA_API_URL;
    if (!apiUrl) {
      throw new ValidationError(
        'API URL is required. Pass apiUrl in config or ' +
          'set GIZA_API_URL environment variable.',
      );
    }

    if (config.chain === undefined || config.chain === null) {
      throw new ValidationError('chain is required');
    }

    try {
      new URL(apiUrl);
    } catch {
      throw new ValidationError('apiUrl must be a valid URL');
    }

    validateChainId(config.chain);

    if (
      config.timeout !== undefined &&
      (config.timeout <= 0 || !Number.isFinite(config.timeout))
    ) {
      throw new ValidationError('timeout must be a positive number');
    }

    return {
      chain: config.chain,
      apiKey,
      partner,
      apiUrl: apiUrl.replace(/\/$/, ''),
      agentId: DEFAULT_AGENT_ID,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      enableRetry: config.enableRetry ?? false,
    };
  }
}
