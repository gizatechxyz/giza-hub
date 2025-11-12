/**
 * E2E Tests for Giza Agent SDK
 * 
 * These tests run on localbackend services (agents-api and arma-backend)
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

  describe('Smart Account Creation - BASE Chain', () => {
    let agent: GizaAgent;

    beforeAll(() => {
      agent = new GizaAgent({
        chainId: Chain.BASE,
      });
    });

    it('should create a smart account on BASE chain', async () => {
      const result = await agent.smartAccount.create({
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
        agent.smartAccount.create({
          origin_wallet: 'invalid-address' as any,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Get Smart Account Info', () => {
    let agent: GizaAgent;
    let smartAccountAddress: string;

    beforeAll(async () => {
      agent = new GizaAgent({
        chainId: Chain.BASE,
      });

      // Create account first
      const result = await agent.smartAccount.create({
        origin_wallet: TEST_EOA_BASE as any,
      });
      smartAccountAddress = result.smartAccountAddress;
    }, 30000);

    it('should get smart account info by EOA', async () => {
      const result = await agent.smartAccount.getInfo({
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
        agent.smartAccount.getInfo({
          origin_wallet: nonExistentEOA as any,
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Error Handling', () => {
    let agent: GizaAgent;

    beforeAll(() => {
      agent = new GizaAgent({
        chainId: Chain.BASE,
      });
    });

    it('should handle invalid authentication', async () => {
      const originalApiKey = process.env.GIZA_API_KEY;

      try {
        process.env.GIZA_API_KEY = 'invalid-api-key';

        const unauthorizedAgent = new GizaAgent({
          chainId: Chain.BASE,
        });

        await expect(
          unauthorizedAgent.smartAccount.create({
            origin_wallet: TEST_EOA_BASE as any,
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
          agent.smartAccount.create({
            origin_wallet: invalidAddress as any,
          })
        ).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('Multiple Chains', () => {
    it('should handle accounts on different chains independently', async () => {
      const baseAgent = new GizaAgent({ chainId: Chain.BASE });
      const arbitrumAgent = new GizaAgent({ chainId: Chain.ARBITRUM });

      const baseResult = await baseAgent.smartAccount.create({
        origin_wallet: TEST_EOA_BASE as any,
      });

      const arbitrumResult = await arbitrumAgent.smartAccount.create({
        origin_wallet: TEST_EOA_ARBITRUM as any,
      });

      expect(baseResult.chain).toBe(Chain.BASE);
      expect(arbitrumResult.chain).toBe(Chain.ARBITRUM);

      // Addresses should be different (different chains)
      expect(baseResult.smartAccountAddress).not.toBe(arbitrumResult.smartAccountAddress);
    }, 30000);
  });

  describe('Custom Configuration', () => {
    it('should work with custom agent ID', async () => {
      const customAgent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'test-agent-e2e',
      });

      expect(customAgent.getAgentId()).toBe('test-agent-e2e');

    
        const result = await customAgent.smartAccount.create({
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

      const result = await customAgent.smartAccount.create({
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

      const result = await retryAgent.smartAccount.create({
        origin_wallet: TEST_EOA_BASE as any,
      });

      expect(result).toBeDefined();
    }, 30000);
  });

  describe('Concurrent Operations', () => {
    let agent: GizaAgent;

    beforeAll(() => {
      agent = new GizaAgent({
        chainId: Chain.BASE,
      });
    });

    it('should handle concurrent create operations', async () => {
      const promises = [
        agent.smartAccount.create({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        agent.smartAccount.create({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        agent.smartAccount.create({
          origin_wallet: TEST_EOA_BASE as any,
        }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      // All should return the same smart account (idempotent)
      expect(results[0].smartAccountAddress).toBe(results[1].smartAccountAddress);
      expect(results[1].smartAccountAddress).toBe(results[2].smartAccountAddress);
    }, 30000);

    it('should handle concurrent getInfo operations', async () => {
      // Create account first
      await agent.smartAccount.create({
        origin_wallet: TEST_EOA_BASE as any,
      });

      const promises = [
        agent.smartAccount.getInfo({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        agent.smartAccount.getInfo({
          origin_wallet: TEST_EOA_BASE as any,
        }),
        agent.smartAccount.getInfo({
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

