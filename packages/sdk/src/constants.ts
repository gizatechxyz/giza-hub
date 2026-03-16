import { Chain } from './types/common';

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
 * Transaction hash validation regex (0x followed by 64 hex chars)
 */
export const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

/**
 * Human-readable chain names
 */
export const CHAIN_NAMES: Record<Chain, string> = {
  [Chain.DEVNET]: 'Devnet',
  [Chain.ETHEREUM]: 'Ethereum',
  [Chain.POLYGON]: 'Polygon',
  [Chain.CHAIN_999]: 'HyperEVM',
  [Chain.BASE]: 'Base',
  [Chain.CHAIN_9745]: 'Plasma',
  [Chain.SEPOLIA]: 'Sepolia',
  [Chain.ARBITRUM]: 'Arbitrum',
  [Chain.BASE_SEPOLIA]: 'Base Sepolia',
};
