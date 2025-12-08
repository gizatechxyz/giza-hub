import * as readline from 'readline';
import { GizaAgent } from '../../src/client';
import { Chain, ValidationError } from '../../src/types/common';
import { sharedContext } from './shared-context';
import {
  E2E_CONFIG,
  E2E_TIMEOUTS,
  validateE2EConfig,
  logE2EConfig,
} from './test-config';

/**
 * Helper to wait for user input
 */
function waitForUserInput(prompt: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

describe('01 - Smart Account', () => {
  let giza: GizaAgent;

  beforeAll(() => {
    // Validate E2E configuration
    validateE2EConfig();
    logE2EConfig();

    // Initialize SDK client
    giza = new GizaAgent({
      chainId: E2E_CONFIG.CHAIN_ID,
      agentId: E2E_CONFIG.AGENT_ID,
    });

    // Store origin wallet in shared context
    sharedContext.setOriginWallet(E2E_CONFIG.TEST_EOA as `0x${string}`);
  });

  describe('Smart Account Creation', () => {
    it('should create a smart account on Base chain', async () => {
      const result = await giza.agent.createSmartAccount({
        origin_wallet: E2E_CONFIG.TEST_EOA as `0x${string}`,
      });

      // Verify response structure
      expect(result).toHaveProperty('smartAccountAddress');
      expect(result).toHaveProperty('backendWallet');
      expect(result).toHaveProperty('origin_wallet');
      expect(result).toHaveProperty('chain');

      // Verify data types and format
      expect(typeof result.smartAccountAddress).toBe('string');
      expect(typeof result.backendWallet).toBe('string');
      expect(result.smartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.backendWallet).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Verify chain and origin wallet
      expect(result.chain).toBe(Chain.BASE);
      expect(result.origin_wallet).toBe(E2E_CONFIG.TEST_EOA);

      // Store in shared context for subsequent tests
      sharedContext.setSmartAccount(
        result.smartAccountAddress,
        result.backendWallet
      );

      console.log('\n========================================');
      console.log('Smart Account Created Successfully');
      console.log('========================================');
      console.log(`  Smart Account: ${result.smartAccountAddress}`);
      console.log(`  Backend Wallet: ${result.backendWallet}`);
      console.log(`  Origin Wallet: ${result.origin_wallet}`);
      console.log(`  Chain: Base (${result.chain})`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should retrieve existing smart account by origin wallet', async () => {
      // Ensure smart account was created
      const smartAccount = sharedContext.requireSmartAccount();

      const result = await giza.agent.getSmartAccount({
        origin_wallet: E2E_CONFIG.TEST_EOA as `0x${string}`,
      });

      // Should return the same smart account
      expect(result.smartAccountAddress).toBe(smartAccount);
      expect(result.origin_wallet).toBe(E2E_CONFIG.TEST_EOA);
      expect(result.chain).toBe(Chain.BASE);

      console.log('✓ Retrieved existing smart account successfully');
    }, E2E_TIMEOUTS.SHORT);

    it('should return same smart account on repeated creation (idempotent)', async () => {
      const firstAccount = sharedContext.requireSmartAccount();

      // Create again with same origin wallet
      const result = await giza.agent.createSmartAccount({
        origin_wallet: E2E_CONFIG.TEST_EOA as `0x${string}`,
      });

      // Should return the same smart account
      expect(result.smartAccountAddress).toBe(firstAccount);

      console.log('✓ Verified idempotent smart account creation');
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Validation', () => {
    it('should reject invalid origin wallet address', async () => {
      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: 'invalid-address' as `0x${string}`,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty origin wallet address', async () => {
      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: '' as `0x${string}`,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject malformed hex addresses', async () => {
      // Too short
      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: '0x123' as `0x${string}`,
        })
      ).rejects.toThrow(ValidationError);

      // Invalid hex characters
      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: '0xZZZZ35Cc6634C0532925a3b844Bc454e4438f44e' as `0x${string}`,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Interactive Funding Step', () => {
    it('should prompt user to fund the smart account', async () => {
      const smartAccount = sharedContext.requireSmartAccount();

      console.log('\n========================================');
      console.log('        FUNDING REQUIRED');
      console.log('========================================');
      console.log('');
      console.log('Please fund the smart account with USDC:');
      console.log('');
      console.log(`  Smart Account: ${smartAccount}`);
      console.log(`  Chain: Base (8453)`);
      console.log(`  Token: USDC`);
      console.log(`  Required Amount: ~0.1 USDC minimum`);
      console.log('');
      console.log('You can fund using:');
      console.log('  1. Transfer USDC directly to the smart account');
      console.log('  2. Use a bridge to send USDC to Base');
      console.log('');
      console.log('========================================\n');

      await waitForUserInput(
        'Press ENTER after funding the smart account to continue tests...'
      );

      console.log('✓ User confirmed funding complete\n');
    }, E2E_TIMEOUTS.VERY_LONG);
  });

  describe('Post-Creation Verification', () => {
    it('should verify smart account is stored in context', () => {
      expect(sharedContext.hasSmartAccount()).toBe(true);

      const context = sharedContext.get();
      expect(context.smartAccountAddress).toBeDefined();
      expect(context.backendWallet).toBeDefined();
      expect(context.originWallet).toBe(E2E_CONFIG.TEST_EOA);
    });
  });
});

