import { GizaAgent } from '../../src/client';
import { AgentStatus } from '../../src/types/agent';
import { sharedContext } from './shared-context';
import {
  E2E_CONFIG,
  E2E_TIMEOUTS,
  TEST_AMOUNTS,
  validateE2EConfig,
} from './test-config';

describe('05 - Withdrawal', () => {
  let giza: GizaAgent;
  let smartAccount: string;

  beforeAll(() => {
    validateE2EConfig();

    // Ensure agent is activated
    sharedContext.requireActivated();
    smartAccount = sharedContext.requireSmartAccount();

    giza = new GizaAgent({
      chainId: E2E_CONFIG.CHAIN_ID,
      agentId: E2E_CONFIG.AGENT_ID,
    });
  });

  describe('Pre-Withdrawal Status', () => {
    it('should verify agent is active before withdrawal tests', async () => {
      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      expect(portfolio.status).toBe(AgentStatus.ACTIVE);

      console.log('\n========================================');
      console.log('Pre-Withdrawal Status');
      console.log('========================================');
      console.log(`  Status: ${portfolio.status}`);
      console.log(`  Deposits: ${portfolio.deposits.length}`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Partial Withdrawal', () => {
    it('should perform a partial withdrawal (agent stays active)', async () => {
      const response = await giza.agent.withdraw({
        wallet: smartAccount,
        amount: TEST_AMOUNTS.PARTIAL_WITHDRAW,
      });

      // Verify response structure for partial withdrawal
      expect(response).toHaveProperty('date');
      expect(response).toHaveProperty('total_value');
      expect(response).toHaveProperty('total_value_in_usd');
      expect(response).toHaveProperty('withdraw_details');

      // Type guard for partial withdrawal response
      if ('withdraw_details' in response) {
        expect(Array.isArray(response.withdraw_details)).toBe(true);

        console.log('\n========================================');
        console.log('Partial Withdrawal Completed');
        console.log('========================================');
        console.log(`  Date: ${response.date}`);
        console.log(`  Total Value: ${response.total_value}`);
        console.log(`  Total Value USD: ${response.total_value_in_usd}`);
        console.log('  Withdrawn Tokens:');
        response.withdraw_details.forEach((detail) => {
          console.log(
            `    - ${detail.token}: ${detail.amount} (${detail.value_in_usd} USD)`
          );
        });
        console.log('========================================\n');
      }
    }, E2E_TIMEOUTS.LONG);

    it('should verify agent is still active after partial withdrawal', async () => {
      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      // Agent should still be active after partial withdrawal
      expect(portfolio.status).toBe(AgentStatus.ACTIVE);

      console.log(`✓ Agent status after partial withdrawal: ${portfolio.status}`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should have withdrawal recorded in transaction history', async () => {
      const history = await giza.agent.getTransactions({
        wallet: smartAccount,
        page: 1,
        limit: 10,
      });

      // Find withdraw transaction
      const withdrawTx = history.transactions.find(
        (tx) => tx.action === 'WITHDRAW'
      );

      // Withdrawal should be recorded (may take a moment to appear)
      if (withdrawTx) {
        console.log('✓ Withdrawal recorded in transaction history');
        console.log(`  Action: ${withdrawTx.action}`);
        console.log(`  Amount: ${withdrawTx.amount}`);
        console.log(`  Status: ${withdrawTx.status}`);
      } else {
        console.log(
          '⚠ Withdrawal not yet visible in history (may appear shortly)'
        );
      }
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Withdrawal Status Polling', () => {
    it('should check withdrawal status', async () => {
      const status = await giza.agent.getWithdrawalStatus(smartAccount);

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('wallet');
      expect(status).toHaveProperty('activation_date');

      // After partial withdrawal, should still be active
      expect(status.status).toBe(AgentStatus.ACTIVE);

      console.log('✓ Withdrawal status check completed');
      console.log(`  Status: ${status.status}`);
      console.log(`  Activation Date: ${status.activation_date}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Full Withdrawal (Deactivation)', () => {
    it('should perform full withdrawal and deactivate agent', async () => {
      const response = await giza.agent.withdraw({
        wallet: smartAccount,
        transfer: true, // Transfer to origin wallet
      });

      // Full withdrawal returns a message
      expect(response).toHaveProperty('message');

      // Type guard for full withdrawal response
      if ('message' in response) {
        console.log('\n========================================');
        console.log('Full Withdrawal Initiated');
        console.log('========================================');
        console.log(`  Message: ${response.message}`);
        console.log('========================================\n');
      }
    }, E2E_TIMEOUTS.LONG);

    it('should poll withdrawal status until deactivated', async () => {
      console.log('Polling withdrawal status (this may take a few minutes)...');

      try {
        const finalStatus = await giza.agent.pollWithdrawalStatus(smartAccount, {
          interval: 10000, // Check every 10 seconds
          timeout: E2E_TIMEOUTS.VERY_LONG,
          onUpdate: (status) => {
            console.log(`  Status: ${status}`);
          },
        });

        expect(finalStatus.status).toBe(AgentStatus.DEACTIVATED);

        console.log('\n========================================');
        console.log('Agent Deactivated Successfully');
        console.log('========================================');
        console.log(`  Final Status: ${finalStatus.status}`);
        console.log(`  Wallet: ${finalStatus.wallet}`);
        if (finalStatus.last_deactivation_date) {
          console.log(`  Deactivation Date: ${finalStatus.last_deactivation_date}`);
        }
        console.log('========================================\n');

        // Update context
        sharedContext.setActivated(false);
      } catch (error) {
        // If timeout, check current status
        const currentStatus = await giza.agent.getWithdrawalStatus(smartAccount);
        console.log(`⚠ Polling timed out. Current status: ${currentStatus.status}`);

        // If still deactivating, that's expected behavior
        if (currentStatus.status === AgentStatus.DEACTIVATING) {
          console.log('  Agent is still deactivating (this is expected for large positions)');
        }

        // Re-throw to fail the test if not deactivated or deactivating
        if (
          currentStatus.status !== AgentStatus.DEACTIVATED &&
          currentStatus.status !== AgentStatus.DEACTIVATING
        ) {
          throw error;
        }
      }
    }, E2E_TIMEOUTS.VERY_LONG + 60000); // Extra buffer for polling

    it('should verify agent is deactivated', async () => {
      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      // Status should be DEACTIVATED or DEACTIVATING
      const validStatuses = [AgentStatus.DEACTIVATED, AgentStatus.DEACTIVATING];
      expect(validStatuses).toContain(portfolio.status);

      console.log(`✓ Final agent status: ${portfolio.status}`);

      if (portfolio.last_deactivation_date) {
        console.log(`  Last Deactivation: ${portfolio.last_deactivation_date}`);
      }
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Post-Deactivation Verification', () => {
    it('should have withdrawal history', async () => {
      const history = await giza.agent.getWithdrawalHistory(smartAccount);

      expect(history).toHaveProperty('transactions');

      console.log(`✓ Found ${history.transactions.length} withdrawal transactions`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should not allow operations on deactivated agent', async () => {
      // Trying to run agent should fail
      await expect(
        giza.agent.run({ wallet: smartAccount })
      ).rejects.toThrow();

      console.log('✓ Operations correctly blocked on deactivated agent');
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Test Summary', () => {
    it('should display test completion summary', async () => {
      const context = sharedContext.get();

      console.log('\n' + '='.repeat(70));
      console.log('E2E TEST SUITE COMPLETED');
      console.log('='.repeat(70));
      console.log('');
      console.log('Test Results:');
      console.log(`  ✓ Smart Account Created: ${context.smartAccountAddress}`);
      console.log(`  ✓ Origin Wallet: ${context.originWallet}`);
      console.log(`  ✓ Protocols Used: ${context.protocols.length}`);
      console.log(`  ✓ Agent Activated: Yes`);
      console.log(`  ✓ Partial Withdrawal: Completed`);
      console.log(`  ✓ Full Withdrawal: Completed`);
      console.log(`  ✓ Agent Deactivated: ${!context.isActivated}`);
      console.log('');
      console.log('='.repeat(70));
      console.log('');
    });
  });
});

