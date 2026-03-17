import { Chain } from './common';

/**
 * Configuration options for the Giza SDK.
 *
 * Constructor credentials override environment variables.
 * Env vars (`GIZA_API_KEY`, `GIZA_PARTNER_NAME`, `GIZA_API_URL`)
 * are used as fallback when options are omitted.
 */
export interface GizaConfig {
  /** Blockchain network to use (required). */
  chain: Chain;
  /** Partner API key. Falls back to GIZA_API_KEY env var. */
  apiKey?: string;
  /** Partner name. Falls back to GIZA_PARTNER_NAME env var. */
  partner?: string;
  /** Bearer token for direct authentication. */
  bearerToken?: string;
  /** Backend API URL. Falls back to GIZA_API_URL env var. */
  apiUrl?: string;
  /** HTTP request timeout in ms (default 45 000). */
  timeout?: number;
  /** Auto-retry on 5xx / network errors (default false). */
  enableRetry?: boolean;
}

/**
 * Internal configuration after defaults are resolved.
 */
export interface ResolvedGizaConfig {
  chain: Chain;
  apiKey?: string;
  partner?: string;
  bearerToken?: string;
  apiUrl: string;
  agentId: string;
  timeout: number;
  enableRetry: boolean;
}
