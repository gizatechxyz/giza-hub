import { HttpClient } from './http/client';
import { PartnerAuth } from './auth/partner-auth';
import { SmartAccountModule } from './modules/smart-account.module';
import { PerformanceModule } from './modules/performance.module';
import { GizaAgentConfig, ResolvedGizaAgentConfig } from './types/config';
import { Chain, ValidationError } from './types/common';
import { DEFAULT_AGENT_ID, DEFAULT_TIMEOUT } from './constants';

/**
 * Main Giza Agent SDK client
 * 
 * Provides access to Giza's agent infrastructure.
 * 
 * @example
 * ```typescript
 * import { GizaAgent, Chain } from '@giza/agent-sdk';
 * 
 * // Set environment variables first:
 * // GIZA_API_KEY=...
 * // GIZA_API_URL=...
 * 
 * const agent = new GizaAgent({
 *   chainId: Chain.BASE,
 * });
 * 
 * // Create smart account
 * const account = await agent.smartAccount.create({
 *   origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
 * });
 * ```
 */
export class GizaAgent {
  private readonly config: ResolvedGizaAgentConfig;
  private readonly httpClient: HttpClient;
  private readonly auth: PartnerAuth;

  /**
   * Smart Account module for creating and managing ZeroDev smart accounts
   */
  public readonly smartAccount: SmartAccountModule;

  /**
   * Performance module for tracking agent performance and analytics
   */
  public readonly performance: PerformanceModule;

  constructor(config: GizaAgentConfig) {
    // Validate and resolve configuration
    this.config = this.validateAndResolveConfig(config);

    // Initialize authentication
    this.auth = new PartnerAuth(this.config.partnerApiKey);

    // Initialize HTTP client with authentication headers
    this.httpClient = new HttpClient({
      baseURL: this.config.backendUrl,
      timeout: this.config.timeout,
      enableRetry: this.config.enableRetry,
      headers: this.auth.getHeaders(),
    });

    // Initialize modules
    this.smartAccount = new SmartAccountModule(this.httpClient, this.config);
    this.performance = new PerformanceModule(this.httpClient, this.config);
  }

  /**
   * Validate configuration and apply defaults
   */
  private validateAndResolveConfig(config: GizaAgentConfig): ResolvedGizaAgentConfig {
    // Get partner API key from environment
    const partnerApiKey = process.env.GIZA_API_KEY;

    if (!partnerApiKey) {
      throw new ValidationError(
        'GIZA_API_KEY environment variable is required'
      );
    }

    // Get backend URL from environment
    const backendUrl = process.env.GIZA_API_URL;

    if (!backendUrl) {
      throw new ValidationError(
        'GIZA_API_URL environment variable is required'
      );
    }

    if (config.chainId === undefined || config.chainId === null) {
      throw new ValidationError('chainId is required');
    }

    // Validate backendUrl format
    try {
      new URL(backendUrl);
    } catch {
      throw new ValidationError('backendUrl must be a valid URL');
    }

    // Validate chainId is a supported chain
    const validChains = Object.values(Chain).filter((v) => typeof v === 'number') as number[];
    if (!validChains.includes(config.chainId)) {
      throw new ValidationError(
        `chainId must be one of: ${validChains.join(', ')}. Got: ${config.chainId}`
      );
    }

    // Validate timeout if provided
    if (config.timeout !== undefined && (config.timeout <= 0 || !Number.isFinite(config.timeout))) {
      throw new ValidationError('timeout must be a positive number');
    }

    return {
      partnerApiKey,
      backendUrl: backendUrl.replace(/\/$/, ''), // Remove trailing slash
      chainId: config.chainId,
      agentId: config.agentId || DEFAULT_AGENT_ID,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      enableRetry: config.enableRetry ?? false,
    };
  }

  /**
   * Get the current configuration
   */
  public getConfig(): Omit<ResolvedGizaAgentConfig, 'partnerApiKey'> {
    const { partnerApiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Get the configured chain ID
   */
  public getChainId(): Chain {
    return this.config.chainId;
  }

  /**
   * Get the configured backend URL
   */
  public getBackendUrl(): string {
    return this.config.backendUrl;
  }

  /**
   * Get the configured agent ID
   */
  public getAgentId(): string {
    return this.config.agentId;
  }
}
