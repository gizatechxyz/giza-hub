/**
 * E2E Tests for Giza Agent SDK
 * 
 * These tests run on local backend services (agents-api and arma-backend)
 * 
 * Prerequisites:
 * - agents-api running locally
 * - arma-backend running locally
 * - GIZA_API_KEY environment variable set
 * - GIZA_API_URL environment variable set
 */

import { GizaAgent } from '../../src/client';
import { Chain, ValidationError } from '../../src/types/common';
import { GizaAPIError } from '../../src/http/errors';

describe('Agent SDK E2E Tests', () => {
  // Test wallet addresses - use deterministic test addresses
  const TEST_EOA_BASE = process.env.TEST_EOA_BASE || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const TEST_EOA_ARBITRUM =
    process.env.TEST_EOA_ARBITRUM || '0x1234567890123456789012345678901234567890';

  // ============================================================================
  // Smart Account Creation Tests
  // ============================================================================

  describe('Smart Account Creation - BASE Chain', () => {
    let giza: GizaAgent;

    beforeAll(() => {
      giza = new GizaAgent({
        chainId: Chain.BASE,
      });
    });

    it('should create a smart account on BASE chain', async () => {
      const result = await giza.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });

      // Verify response structure
      expect(result).toHaveProperty('smartAccountAddress');
      expect(result).toHaveProperty('backendWallet');
      expect(result).toHaveProperty('origin_wallet');
      expect(result).toHaveProperty('chain');

      // Verify data types
      expect(typeof result.smartAccountAddress).toBe('string');
      expect(typeof result.backendWallet).toBe('string');
      expect(result.smartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.backendWallet).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Verify chain
      expect(result.chain).toBe(Chain.BASE);
      expect(result.origin_wallet).toBe(TEST_EOA_BASE);

      console.log('Created smart account on BASE:');
      console.log(`  Smart Account: ${result.smartAccountAddress}`);
      console.log(`  Backend Wallet: ${result.backendWallet}`);
    }, 30000);

    it('should reject invalid EOA address', async () => {
      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: 'invalid-address' as any,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  // ============================================================================
  // Get Smart Account Info Tests
  // ============================================================================

  describe('Get Smart Account Info', () => {
    let giza: GizaAgent;
    let smartAccountAddress: string;

    beforeAll(async () => {
      giza = new GizaAgent({
        chainId: Chain.BASE,
      });

      // Create account first
      const result = await giza.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });
      smartAccountAddress = result.smartAccountAddress;
    }, 30000);

    it('should get smart account info by EOA', async () => {
      const result = await giza.agent.getSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });

      expect(result).toHaveProperty('smartAccountAddress');
      expect(result.smartAccountAddress).toBe(smartAccountAddress);
      expect(result.chain).toBe(Chain.BASE);
      expect(result.origin_wallet).toBe(TEST_EOA_BASE);

      console.log('Retrieved smart account info:');
      console.log(`  Smart Account: ${result.smartAccountAddress}`);
      console.log(`  Backend Wallet: ${result.backendWallet}`);
    }, 30000);

    it('should throw error for non-existent account', async () => {
      const nonExistentEOA = '0x9999999999999999999999999999999999999999';

      await expect(
        giza.agent.getSmartAccount({
          origin_wallet: nonExistentEOA as any,
        })
      ).rejects.toThrow();
    }, 30000);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    let giza: GizaAgent;

    beforeAll(() => {
      giza = new GizaAgent({
        chainId: Chain.BASE,
      });
    });

    // Note: The zerodev proxy endpoint doesn't require authentication,
    // so we test against an endpoint that does (e.g., getPortfolio for a wallet)
    it('should handle invalid authentication on protected endpoints', async () => {
      const originalApiKey = process.env.GIZA_API_KEY;

      try {
        process.env.GIZA_API_KEY = 'invalid-api-key';

        const unauthorizedAgent = new GizaAgent({
          chainId: Chain.BASE,
        });

        // getPortfolio requires authentication
        await expect(
          unauthorizedAgent.agent.getPortfolio({
            wallet: TEST_EOA_BASE as any,
          })
        ).rejects.toThrow();
      } finally {
        // Restore original API key
        process.env.GIZA_API_KEY = originalApiKey;
      }
    }, 30000);

    it('should handle malformed addresses', async () => {
      const invalidAddresses = [
        'not-an-address',
        '0x123', // too short
        '0xZZZZ35Cc6634C0532925a3b844Bc454e4438f44e', // invalid hex
        '', // empty
      ];

      for (const invalidAddress of invalidAddresses) {
        await expect(
          giza.agent.createSmartAccount({
            origin_wallet: invalidAddress as any,
          })
        ).rejects.toThrow(ValidationError);
      }
    });
  });

  // ============================================================================
  // Multiple Chains Tests
  // ============================================================================

  describe('Multiple Chains', () => {
    it('should handle accounts on different chains independently', async () => {
      const baseAgent = new GizaAgent({ chainId: Chain.BASE });
      const arbitrumAgent = new GizaAgent({ chainId: Chain.ARBITRUM });

      const baseResult = await baseAgent.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });

      const arbitrumResult = await arbitrumAgent.agent.createSmartAccount({
        origin_wallet: TEST_EOA_ARBITRUM as any,
      });

      expect(baseResult.chain).toBe(Chain.BASE);
      expect(arbitrumResult.chain).toBe(Chain.ARBITRUM);

      // Addresses should be different (different chains)
      expect(baseResult.smartAccountAddress).not.toBe(arbitrumResult.smartAccountAddress);
    }, 30000);
  });

  // ============================================================================
  // Custom Configuration Tests
  // ============================================================================

  describe('Custom Configuration', () => {
    it('should work with custom agent ID', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'test-agent-e2e',
      });

      expect(customAgent.getAgentId()).toBe('test-agent-e2e');

      const result = await customAgent.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });
      expect(result).toBeDefined();
    }, 30000);

    it('should work with custom timeout', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        timeout: 60000,
      });

      expect(customAgent.getConfig().timeout).toBe(60000);

      const result = await customAgent.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });

      expect(result).toBeDefined();
    }, 30000);

    it('should work with retry enabled', async () => {
      const retryAgent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });

      expect(retryAgent.getConfig().enableRetry).toBe(true);

      const result = await retryAgent.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });

      expect(result).toBeDefined();
    }, 30000);
  });

  // ============================================================================
  // Concurrent Operations Tests
  // ============================================================================

  describe('Concurrent Operations', () => {
    let giza: GizaAgent;

    beforeAll(() => {
      giza = new GizaAgent({
        chainId: Chain.BASE,
      });
    });

    it('should handle concurrent create operations', async () => {
      const promises = [
        giza.agent.createSmartAccount({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        giza.agent.createSmartAccount({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        giza.agent.createSmartAccount({
          origin_wallet: TEST_EOA_BASE as any,
        }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      // All should return the same smart account (idempotent)
      expect(results[0].smartAccountAddress).toBe(results[1].smartAccountAddress);
      expect(results[1].smartAccountAddress).toBe(results[2].smartAccountAddress);
    }, 30000);

    it('should handle concurrent getSmartAccount operations', async () => {
      // Create account first
      await giza.agent.createSmartAccount({
        origin_wallet: TEST_EOA_BASE as any,
      });

      const promises = [
        giza.agent.getSmartAccount({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        giza.agent.getSmartAccount({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        giza.agent.getSmartAccount({
          origin_wallet: TEST_EOA_BASE as any,
        }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].smartAccountAddress).toBe(results[1].smartAccountAddress);
      expect(results[1].smartAccountAddress).toBe(results[2].smartAccountAddress);
    }, 30000);
  });
});
