import { HttpClient } from './http/client';
import { PartnerAuth } from './auth/partner-auth';
import { AgentModule } from './modules/agent.module';
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
 * // Set environment variables:
 * // GIZA_API_KEY=your-partner-api-key
 * // GIZA_API_URL=...
 * 
 * const giza = new GizaAgent({
 *   chainId: Chain.BASE,
 * });
 * 
 * // Create smart account for user
 * const account = await giza.agent.createSmartAccount({
 *   origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
 * });
 * 
 * // Get available protocols
 * const { protocols } = await giza.agent.getProtocols(USDC_ADDRESS);
 * 
 * // Activate agent after user deposits
 * await giza.agent.activate({
 *   wallet: account.smartAccountAddress,
 *   origin_wallet: userWallet,
 *   initial_token: USDC_ADDRESS,
 *   selected_protocols: protocols,
 *   tx_hash: depositTxHash,
 * });
 * 
 * // Monitor performance
 * const performance = await giza.agent.getPerformance({ wallet: account.smartAccountAddress });
 * const apr = await giza.agent.getAPR({ wallet: account.smartAccountAddress });
 * 
 * // Withdraw
 * await giza.agent.withdraw({ wallet: account.smartAccountAddress, transfer: true });
 * ```
 */
export class GizaAgent {
  private readonly config: ResolvedGizaAgentConfig;
  private readonly httpClient: HttpClient;
  private readonly auth: PartnerAuth;

  /**
   * Unified Agent module for all agent operations
   * 
   * Provides:
   * - Smart account creation and management
   * - Protocol selection and configuration
   * - Agent lifecycle (activate, deactivate, run, topUp)
   * - Performance monitoring and history
   * - Withdrawal operations
   * - Rewards claiming
   */
  public readonly agent: AgentModule;

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

    // Initialize unified agent module
    this.agent = new AgentModule(this.httpClient, this.config);
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
