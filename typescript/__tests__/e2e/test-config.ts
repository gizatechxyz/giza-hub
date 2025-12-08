import { Chain } from '../../src/types/common';

/**
 * E2E Test Configuration Constants
 */
export const E2E_CONFIG = {
  /**
   * Test EOA wallet address
   */
  TEST_EOA: process.env.E2E_TEST_EOA || '',

  /**
   * Chain ID for testing (Base)
   */
  CHAIN_ID: Chain.BASE,

  /**
   * Default agent ID for testing
   */
  AGENT_ID: 'giza-app',
} as const;

/**
 * Token addresses on Base chain (8453)
 */
export const BASE_TOKEN_ADDRESSES = {
  /**
   * USDC on Base
   */
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,

  /**
   * WETH on Base
   */
  WETH: '0x4200000000000000000000000000000000000006' as const,
} as const;

/**
 * Test amounts for transactions
 * All amounts are in the token's smallest unit (e.g., 6 decimals for USDC)
 */
export const TEST_AMOUNTS = {
  /**
   * Small amount for testing (0.01 USDC = 10000)
   */
  SMALL: '10000',

  /**
   * Medium amount for testing (0.1 USDC = 100000)
   */
  MEDIUM: '100000',

  /**
   * Large amount for testing (1 USDC = 1000000)
   */
  LARGE: '1000000',

  /**
   * Partial withdrawal amount (0.001 USDC = 1000)
   */
  PARTIAL_WITHDRAW: '1000',
} as const;

/**
 * Timeouts for E2E tests (in milliseconds)
 */
export const E2E_TIMEOUTS = {
  /**
   * Short timeout for quick operations
   */
  SHORT: 30000,

  /**
   * Medium timeout for network operations
   */
  MEDIUM: 60000,

  /**
   * Long timeout for operations that may take a while
   */
  LONG: 120000,

  /**
   * Very long timeout for complex operations
   */
  VERY_LONG: 300000,
} as const;

/**
 * Validate that required E2E configuration is set
 * @throws Error if required configuration is missing
 */
export function validateE2EConfig(): void {
  if (!E2E_CONFIG.TEST_EOA) {
    throw new Error(
      'E2E_TEST_EOA environment variable is required. ' +
        'Please set it to a funded EOA wallet address on Base chain.'
    );
  }

  // Validate address format
  if (
    !E2E_CONFIG.TEST_EOA.startsWith('0x') ||
    E2E_CONFIG.TEST_EOA.length !== 42
  ) {
    throw new Error(
      'E2E_TEST_EOA must be a valid Ethereum address (0x... format, 42 characters)'
    );
  }
}

/**
 * Get the test EOA address
 * @throws Error if not set
 */
export function getTestEOA(): string {
  validateE2EConfig();
  return E2E_CONFIG.TEST_EOA;
}

/**
 * Log E2E configuration for debugging
 */
export function logE2EConfig(): void {
  console.log('\nE2E Test Configuration:');
  console.log(`  Chain: Base (${E2E_CONFIG.CHAIN_ID})`);
  console.log(`  Agent ID: ${E2E_CONFIG.AGENT_ID}`);
  console.log(`  Test EOA: ${E2E_CONFIG.TEST_EOA || '(not set)'}`);
  console.log(`  USDC Address: ${BASE_TOKEN_ADDRESSES.USDC}`);
  console.log('');
}

