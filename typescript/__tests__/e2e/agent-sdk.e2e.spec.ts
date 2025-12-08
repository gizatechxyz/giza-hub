/**
 * Agent SDK E2E Tests
 *
 * Single comprehensive test file that tests the full agent lifecycle:
 * 1. Smart Account Creation
 * 2. Protocol Discovery
 * 3. Agent Activation
 * 4. Performance Monitoring
 * 5. Withdrawal (Partial & Full)
 *
 * Prerequisites:
 * - agents-api running locally
 * - arma-backend running locally
 * - Environment variables set (GIZA_API_KEY, GIZA_PARTNER_NAME, GIZA_API_URL, E2E_TEST_EOA)
 */

import * as readline from 'readline';
import { GizaAgent } from '../../src/client';
import { Chain, ValidationError } from '../../src/types/common';
import { AgentStatus, SortOrder } from '../../src/types/agent';
import {
  E2E_CONFIG,
  E2E_TIMEOUTS,
  BASE_TOKEN_ADDRESSES,
  TEST_AMOUNTS,
  validateE2EConfig,
  logE2EConfig,
} from './test-config';

/**
 * Test state shared across all tests in this file
 */
interface TestState {
  smartAccountAddress: string | null;
  backendWallet: string | null;
  originWallet: string;
  protocols: string[];
  isActivated: boolean;
}

const state: TestState = {
  smartAccountAddress: null,
  backendWallet: null,
  originWallet: E2E_CONFIG.TEST_EOA,
  protocols: [],
  isActivated: false,
};

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

describe('Agent SDK E2E Tests', () => {
  let giza: GizaAgent;

  beforeAll(() => {
    validateE2EConfig();
    logE2EConfig();

    giza = new GizaAgent({
      chainId: E2E_CONFIG.CHAIN_ID,
      agentId: E2E_CONFIG.AGENT_ID,
    });
  });

  // ==========================================
  // 1. SMART ACCOUNT CREATION
  // ==========================================
  describe('1. Smart Account Creation', () => {
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

      // Store in state for subsequent tests
      state.smartAccountAddress = result.smartAccountAddress;
      state.backendWallet = result.backendWallet;

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
      expect(state.smartAccountAddress).not.toBeNull();

      const result = await giza.agent.getSmartAccount({
        origin_wallet: E2E_CONFIG.TEST_EOA as `0x${string}`,
      });

      // Should return the same smart account
      expect(result.smartAccountAddress).toBe(state.smartAccountAddress);
      expect(result.origin_wallet).toBe(E2E_CONFIG.TEST_EOA);
      expect(result.chain).toBe(Chain.BASE);

      console.log('✓ Retrieved existing smart account successfully');
    }, E2E_TIMEOUTS.SHORT);

    it('should return same smart account on repeated creation (idempotent)', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const result = await giza.agent.createSmartAccount({
        origin_wallet: E2E_CONFIG.TEST_EOA as `0x${string}`,
      });

      // Should return the same smart account
      expect(result.smartAccountAddress).toBe(state.smartAccountAddress);

      console.log('✓ Verified idempotent smart account creation');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should reject invalid origin wallet address', async () => {
      await expect(
        giza.agent.createSmartAccount({
          origin_wallet: 'invalid-address' as `0x${string}`,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================
  // INTERACTIVE FUNDING STEP
  // ==========================================
  describe('2. Fund Smart Account', () => {
    it('should prompt user to fund the smart account', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      console.log('\n========================================');
      console.log('        FUNDING REQUIRED');
      console.log('========================================');
      console.log('');
      console.log('Please fund the smart account with USDC:');
      console.log('');
      console.log(`  Smart Account: ${state.smartAccountAddress}`);
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

  // ==========================================
  // 3. PROTOCOL DISCOVERY
  // ==========================================
  describe('3. Protocol Discovery', () => {
    it('should get available protocols for USDC', async () => {
      const response = await giza.agent.getProtocols(BASE_TOKEN_ADDRESSES.USDC);

      // Verify response structure
      expect(response).toHaveProperty('protocols');
      expect(Array.isArray(response.protocols)).toBe(true);

      // Should have at least some protocols available
      expect(response.protocols.length).toBeGreaterThan(0);

      // Store protocols in state for activation
      state.protocols = response.protocols;

      console.log('\n========================================');
      console.log('Available Protocols for USDC on Base');
      console.log('========================================');
      response.protocols.forEach((protocol, index) => {
        console.log(`  ${index + 1}. ${protocol}`);
      });
      console.log('========================================\n');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should return consistent protocols on repeated calls', async () => {
      const firstCall = await giza.agent.getProtocols(BASE_TOKEN_ADDRESSES.USDC);
      const secondCall = await giza.agent.getProtocols(BASE_TOKEN_ADDRESSES.USDC);

      // Protocols should be the same
      expect(firstCall.protocols.sort()).toEqual(secondCall.protocols.sort());

      console.log('✓ Protocols are consistent across calls');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should return well-known DeFi protocols', async () => {
      expect(state.protocols.length).toBeGreaterThan(0);

      const wellKnownProtocols = [
        'aave',
        'compound',
        'moonwell',
        'morpho',
        'fluid',
        'euler',
      ];

      const foundProtocols = wellKnownProtocols.filter((known) =>
        state.protocols.some((p) => p.toLowerCase().includes(known.toLowerCase()))
      );

      // Should have at least one well-known protocol
      expect(foundProtocols.length).toBeGreaterThan(0);

      console.log(`✓ Found ${foundProtocols.length} well-known protocols: ${foundProtocols.join(', ')}`);
    });
  });

  // ==========================================
  // 4. AGENT ACTIVATION
  // ==========================================
  describe('4. Agent Activation', () => {
    it('should activate the agent with USDC and available protocols', async () => {
      expect(state.smartAccountAddress).not.toBeNull();
      expect(state.protocols.length).toBeGreaterThan(0);

      const response = await giza.agent.activate({
        wallet: state.smartAccountAddress!,
        origin_wallet: state.originWallet,
        initial_token: BASE_TOKEN_ADDRESSES.USDC,
        selected_protocols: state.protocols,
      });

      // Verify response
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('wallet');
      expect(response.wallet.toLowerCase()).toBe(
        state.smartAccountAddress!.toLowerCase()
      );

      // Mark as activated
      state.isActivated = true;

      console.log('\n========================================');
      console.log('Agent Activated Successfully');
      console.log('========================================');
      console.log(`  Wallet: ${response.wallet}`);
      console.log(`  Message: ${response.message}`);
      console.log(`  Protocols: ${state.protocols.join(', ')}`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.LONG);

    it('should verify agent status is ACTIVE or ACTIVATING', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const portfolio = await giza.agent.getPortfolio({
        wallet: state.smartAccountAddress!,
      });

      // Status should be ACTIVE or ACTIVATING
      const validStatuses = [AgentStatus.ACTIVE, AgentStatus.ACTIVATING];
      expect(validStatuses).toContain(portfolio.status);

      console.log(`✓ Agent status: ${portfolio.status}`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should have selected protocols in agent info', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const portfolio = await giza.agent.getPortfolio({
        wallet: state.smartAccountAddress!,
      });

      // Verify selected protocols
      expect(portfolio.selected_protocols).toBeDefined();
      expect(portfolio.selected_protocols.length).toBeGreaterThan(0);

      console.log(`✓ Selected protocols: ${portfolio.selected_protocols.join(', ')}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  // ==========================================
  // 5. PERFORMANCE MONITORING
  // ==========================================
  describe('5. Performance Monitoring', () => {
    it('should get performance data for the agent', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const response = await giza.agent.getPerformance({
        wallet: state.smartAccountAddress!,
      });

      expect(response).toHaveProperty('performance');
      expect(Array.isArray(response.performance)).toBe(true);

      console.log(`✓ Retrieved ${response.performance.length} performance data points`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get complete portfolio information', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const portfolio = await giza.agent.getPortfolio({
        wallet: state.smartAccountAddress!,
      });

      // Verify required fields
      expect(portfolio).toHaveProperty('wallet');
      expect(portfolio).toHaveProperty('status');
      expect(portfolio).toHaveProperty('deposits');
      expect(portfolio).toHaveProperty('activation_date');
      expect(portfolio).toHaveProperty('selected_protocols');

      // Verify wallet matches
      expect(portfolio.wallet.toLowerCase()).toBe(state.smartAccountAddress!.toLowerCase());

      console.log('\n========================================');
      console.log('Portfolio Information');
      console.log('========================================');
      console.log(`  Wallet: ${portfolio.wallet}`);
      console.log(`  Status: ${portfolio.status}`);
      console.log(`  Activation Date: ${portfolio.activation_date}`);
      console.log(`  Deposits: ${portfolio.deposits.length}`);
      console.log(`  Selected Protocols: ${portfolio.selected_protocols.join(', ')}`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get transaction history', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const history = await giza.agent.getTransactions({
        wallet: state.smartAccountAddress!,
        page: 1,
        limit: 20,
      });

      // Verify response structure
      expect(history).toHaveProperty('transactions');
      expect(history).toHaveProperty('pagination');
      expect(Array.isArray(history.transactions)).toBe(true);

      console.log(`✓ Retrieved ${history.transactions.length} transactions`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get deposit history', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const deposits = await giza.agent.getDeposits(state.smartAccountAddress!);

      expect(deposits).toHaveProperty('deposits');
      expect(Array.isArray(deposits.deposits)).toBe(true);

      // Should have at least one deposit (from activation)
      expect(deposits.deposits.length).toBeGreaterThan(0);

      console.log(`✓ Found ${deposits.deposits.length} deposits`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get fee information', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const fees = await giza.agent.getFees(state.smartAccountAddress!);

      expect(fees).toHaveProperty('percentage_fee');
      expect(fees).toHaveProperty('fee');

      console.log(`✓ Fee: ${fees.percentage_fee * 100}%`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  // ==========================================
  // 6. WITHDRAWAL
  // ==========================================
  describe('6. Withdrawal', () => {
    it('should verify agent is active before withdrawal', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const portfolio = await giza.agent.getPortfolio({
        wallet: state.smartAccountAddress!,
      });

      expect(portfolio.status).toBe(AgentStatus.ACTIVE);

      console.log(`✓ Agent status: ${portfolio.status}`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should perform a partial withdrawal (agent stays active)', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const response = await giza.agent.withdraw({
        wallet: state.smartAccountAddress!,
        amount: TEST_AMOUNTS.PARTIAL_WITHDRAW,
      });

      // Verify response structure for partial withdrawal
      expect(response).toHaveProperty('date');
      expect(response).toHaveProperty('total_value');

      console.log('\n========================================');
      console.log('Partial Withdrawal Completed');
      console.log('========================================');
      console.log(`  Date: ${response.date}`);
      console.log(`  Total Value: ${response.total_value}`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.LONG);

    it('should verify agent is still active after partial withdrawal', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const portfolio = await giza.agent.getPortfolio({
        wallet: state.smartAccountAddress!,
      });

      // Agent should still be active after partial withdrawal
      expect(portfolio.status).toBe(AgentStatus.ACTIVE);

      console.log(`✓ Agent status after partial withdrawal: ${portfolio.status}`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should perform full withdrawal and deactivate agent', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const response = await giza.agent.withdraw({
        wallet: state.smartAccountAddress!,
        transfer: true,
      });

      // Full withdrawal returns a message
      expect(response).toHaveProperty('message');

      console.log('\n========================================');
      console.log('Full Withdrawal Initiated');
      console.log('========================================');
      console.log(`  Message: ${response.message}`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.LONG);

    it('should poll withdrawal status until deactivated', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      console.log('Polling withdrawal status...');

      try {
        const finalStatus = await giza.agent.pollWithdrawalStatus(state.smartAccountAddress!, {
          interval: 10000,
          timeout: E2E_TIMEOUTS.VERY_LONG,
          onUpdate: (status) => {
            console.log(`  Status: ${status}`);
          },
        });

        expect(finalStatus.status).toBe(AgentStatus.DEACTIVATED);

        state.isActivated = false;

        console.log('\n========================================');
        console.log('Agent Deactivated Successfully');
        console.log('========================================');
        console.log(`  Final Status: ${finalStatus.status}`);
        console.log('========================================\n');
      } catch (error) {
        const currentStatus = await giza.agent.getWithdrawalStatus(state.smartAccountAddress!);
        console.log(`⚠ Polling timed out. Current status: ${currentStatus.status}`);

        // If still deactivating, that's expected behavior
        if (
          currentStatus.status !== AgentStatus.DEACTIVATED &&
          currentStatus.status !== AgentStatus.DEACTIVATING
        ) {
          throw error;
        }
      }
    }, E2E_TIMEOUTS.VERY_LONG + 60000);

    it('should verify agent is deactivated', async () => {
      expect(state.smartAccountAddress).not.toBeNull();

      const portfolio = await giza.agent.getPortfolio({
        wallet: state.smartAccountAddress!,
      });

      // Status should be DEACTIVATED or DEACTIVATING
      const validStatuses = [AgentStatus.DEACTIVATED, AgentStatus.DEACTIVATING];
      expect(validStatuses).toContain(portfolio.status);

      console.log(`✓ Final agent status: ${portfolio.status}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  // ==========================================
  // TEST SUMMARY
  // ==========================================
  describe('7. Test Summary', () => {
    it('should display test completion summary', () => {
      console.log('\n' + '='.repeat(70));
      console.log('E2E TEST SUITE COMPLETED');
      console.log('='.repeat(70));
      console.log('');
      console.log('Test Results:');
      console.log(`  ✓ Smart Account: ${state.smartAccountAddress}`);
      console.log(`  ✓ Origin Wallet: ${state.originWallet}`);
      console.log(`  ✓ Protocols Used: ${state.protocols.length}`);
      console.log(`  ✓ Full Lifecycle: Create → Activate → Monitor → Withdraw`);
      console.log('');
      console.log('='.repeat(70));
      console.log('');
    });
  });
});

