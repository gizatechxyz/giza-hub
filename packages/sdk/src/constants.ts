/**
 * Default agent ID for Giza smart accounts
 */
export const DEFAULT_AGENT_ID = 'giza-app';

/**
 * Default HTTP timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 45000;

/**
 * Ethereum address validation regex (0x followed by 40 hex chars)
 */
export const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Supported blockchain networks
 */
export enum Chain {
  BASE = 8453,
  ARBITRUM = 42161,
}

/**
 * Human-readable chain names
 */
export const CHAIN_NAMES: Record<Chain, string> = {
  [Chain.BASE]: 'Base',
  [Chain.ARBITRUM]: 'Arbitrum',
};

