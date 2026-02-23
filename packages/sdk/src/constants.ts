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
  DEVNET = -1,
  ETHEREUM = 1,
  POLYGON = 137,
  CHAIN_999 = 999,
  BASE = 8453,
  CHAIN_9745 = 9745,
  SEPOLIA = 11155111,
  ARBITRUM = 42161,
  BASE_SEPOLIA = 84532,
}

/**
 * Human-readable chain names
 */
export const CHAIN_NAMES: Record<Chain, string> = {
  [Chain.DEVNET]: 'Devnet',
  [Chain.ETHEREUM]: 'Ethereum',
  [Chain.POLYGON]: 'Polygon',
  [Chain.CHAIN_999]: 'Chain 999',
  [Chain.BASE]: 'Base',
  [Chain.CHAIN_9745]: 'Chain 9745',
  [Chain.SEPOLIA]: 'Sepolia',
  [Chain.ARBITRUM]: 'Arbitrum',
  [Chain.BASE_SEPOLIA]: 'Base Sepolia',
};

