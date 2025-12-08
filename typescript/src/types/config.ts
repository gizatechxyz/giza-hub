import { Chain } from './common';

/**
 * Configuration options for the Giza SDK
 */
export interface GizaAgentConfig {
  /**
   * Blockchain network to use (required)
   */
  chainId: Chain;

  /**
   * Agent identifier (optional, defaults to "arma-dev")
   * Used to identify which agent manages the smart accounts
   */
  agentId?: string;

  /**
   * HTTP request timeout in milliseconds (optional, defaults to 45000)
   */
  timeout?: number;

  /**
   * Enable automatic retry on failed requests (optional, defaults to false)
   */
  enableRetry?: boolean;
}

/**
 * Internal configuration after defaults are applied
 * Includes credentials loaded from environment variables
 */
export interface ResolvedGizaAgentConfig extends Required<GizaAgentConfig> {
  /**
   * Partner API key loaded from GIZA_API_KEY environment variable
   */
  partnerApiKey: string;

  /**
   * Partner name loaded from GIZA_PARTNER_NAME environment variable
   */
  partnerName: string;

  /**
   * Backend URL loaded from GIZA_API_URL environment variable
   */
  backendUrl: string;
}

