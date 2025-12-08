import { GizaAgent } from '../../src/client';
import { AgentStatus } from '../../src/types/agent';
import { sharedContext } from './shared-context';
import {
  E2E_CONFIG,
  E2E_TIMEOUTS,
  BASE_TOKEN_ADDRESSES,
  validateE2EConfig,
} from './test-config';

describe('03 - Activation', () => {
  let giza: GizaAgent;

  beforeAll(() => {
    validateE2EConfig();

    // Ensure all prerequisites are met
    sharedContext.requireSmartAccount();
    sharedContext.requireProtocols();

    giza = new GizaAgent({
      chainId: E2E_CONFIG.CHAIN_ID,
      agentId: E2E_CONFIG.AGENT_ID,
    });
  });

  describe('Agent Activation', () => {
    it('should activate the agent with USDC and available protocols', async () => {
      const context = sharedContext.get();

      const response = await giza.agent.activate({
        wallet: context.smartAccountAddress!,
        origin_wallet: context.originWallet!,
        initial_token: BASE_TOKEN_ADDRESSES.USDC,
        selected_protocols: context.protocols,
      });

      // Verify response
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('wallet');
      expect(response.wallet.toLowerCase()).toBe(
        context.smartAccountAddress!.toLowerCase()
      );

      // Mark as activated in context
      sharedContext.setActivated(true);

      console.log('\n========================================');
      console.log('Agent Activated Successfully');
      console.log('========================================');
      console.log(`  Wallet: ${response.wallet}`);
      console.log(`  Message: ${response.message}`);
      console.log(`  Protocols: ${context.protocols.join(', ')}`);
      console.log('========================================\n');
    }, E2E_TIMEOUTS.LONG);

    it('should verify agent status is ACTIVE or ACTIVATING', async () => {
      const smartAccount = sharedContext.requireSmartAccount();

      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      // Status should be ACTIVE or ACTIVATING (activation may take some time)
      const validStatuses = [AgentStatus.ACTIVE, AgentStatus.ACTIVATING];
      expect(validStatuses).toContain(portfolio.status);

      console.log(`✓ Agent status: ${portfolio.status}`);
    }, E2E_TIMEOUTS.MEDIUM);

    it('should have selected protocols in agent info', async () => {
      const smartAccount = sharedContext.requireSmartAccount();
      const expectedProtocols = sharedContext.requireProtocols();

      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      // Verify selected protocols
      expect(portfolio.selected_protocols).toBeDefined();
      expect(portfolio.selected_protocols.length).toBeGreaterThan(0);

      // All expected protocols should be in selected protocols
      expectedProtocols.forEach((protocol) => {
        expect(portfolio.selected_protocols).toContain(protocol);
      });

      console.log(`✓ Selected protocols: ${portfolio.selected_protocols.join(', ')}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Portfolio After Activation', () => {
    it('should have deposits recorded', async () => {
      const smartAccount = sharedContext.requireSmartAccount();

      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      expect(portfolio).toHaveProperty('deposits');
      expect(Array.isArray(portfolio.deposits)).toBe(true);

      // Should have at least one deposit after activation
      expect(portfolio.deposits.length).toBeGreaterThan(0);

      console.log('\n✓ Deposits recorded:');
      portfolio.deposits.forEach((deposit, index) => {
        console.log(
          `  ${index + 1}. Amount: ${deposit.amount}, Token: ${deposit.token_type}`
        );
      });
    }, E2E_TIMEOUTS.MEDIUM);

    it('should have activation date set', async () => {
      const smartAccount = sharedContext.requireSmartAccount();

      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      expect(portfolio.activation_date).toBeDefined();
      expect(typeof portfolio.activation_date).toBe('string');

      // Activation date should be recent (within last hour)
      const activationTime = new Date(portfolio.activation_date).getTime();
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      expect(activationTime).toBeGreaterThan(oneHourAgo);
      expect(activationTime).toBeLessThanOrEqual(now);

      console.log(`✓ Activation date: ${portfolio.activation_date}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Context Verification', () => {
    it('should have activation flag set in context', () => {
      expect(sharedContext.get().isActivated).toBe(true);
    });

    it('should have all data required for monitoring tests', () => {
      const context = sharedContext.get();

      expect(context.smartAccountAddress).toBeDefined();
      expect(context.originWallet).toBeDefined();
      expect(context.protocols.length).toBeGreaterThan(0);
      expect(context.isActivated).toBe(true);

      console.log('\n✓ All prerequisites for monitoring tests are ready');
      console.log(`  Smart Account: ${context.smartAccountAddress}`);
      console.log(`  Agent is activated: ${context.isActivated}\n`);
    });
  });
});

