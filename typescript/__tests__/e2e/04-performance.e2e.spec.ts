import { GizaAgent } from '../../src/client';
import { AgentStatus, TxAction, SortOrder } from '../../src/types/agent';
import { sharedContext } from './shared-context';
import { E2E_CONFIG, E2E_TIMEOUTS, validateE2EConfig } from './test-config';

describe('04 - Performance Monitoring', () => {
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

  describe('Performance Chart Data', () => {
    it('should get performance data for the agent', async () => {
      const response = await giza.agent.getPerformance({
        wallet: smartAccount,
      });

      // Verify response structure
      expect(response).toHaveProperty('performance');
      expect(Array.isArray(response.performance)).toBe(true);

      console.log(
        `✓ Retrieved ${response.performance.length} performance data points`
      );

      // If there's performance data, verify structure
      if (response.performance.length > 0) {
        const dataPoint = response.performance[0];
        expect(dataPoint).toHaveProperty('date');
        expect(dataPoint).toHaveProperty('value');

        console.log(`  First data point: ${dataPoint.date}, value: ${dataPoint.value}`);
      }
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get performance data with from_date filter', async () => {
      // Get data from 24 hours ago
      const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const fromDateStr = fromDate.toISOString().replace('T', ' ').split('.')[0];

      const response = await giza.agent.getPerformance({
        wallet: smartAccount,
        from_date: fromDateStr,
      });

      expect(response).toHaveProperty('performance');
      expect(Array.isArray(response.performance)).toBe(true);

      console.log(
        `✓ Retrieved ${response.performance.length} performance points since ${fromDateStr}`
      );
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Portfolio Information', () => {
    it('should get complete portfolio information', async () => {
      const portfolio = await giza.agent.getPortfolio({
        wallet: smartAccount,
      });

      // Verify required fields
      expect(portfolio).toHaveProperty('wallet');
      expect(portfolio).toHaveProperty('status');
      expect(portfolio).toHaveProperty('deposits');
      expect(portfolio).toHaveProperty('activation_date');
      expect(portfolio).toHaveProperty('selected_protocols');

      // Verify wallet matches
      expect(portfolio.wallet.toLowerCase()).toBe(smartAccount.toLowerCase());

      // Verify status is active
      expect(portfolio.status).toBe(AgentStatus.ACTIVE);

      console.log('\n========================================');
      console.log('Portfolio Information');
      console.log('========================================');
      console.log(`  Wallet: ${portfolio.wallet}`);
      console.log(`  Status: ${portfolio.status}`);
      console.log(`  Activation Date: ${portfolio.activation_date}`);
      console.log(`  Deposits: ${portfolio.deposits.length}`);
      console.log(`  Selected Protocols: ${portfolio.selected_protocols.join(', ')}`);
      if (portfolio.current_protocols) {
        console.log(`  Current Protocols: ${portfolio.current_protocols.join(', ')}`);
      }
      if (portfolio.current_token) {
        console.log(`  Current Token: ${portfolio.current_token}`);
      }
      console.log('========================================\n');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get portfolio by origin wallet with eoa flag', async () => {
      const originWallet = sharedContext.get().originWallet!;

      const portfolio = await giza.agent.getPortfolio({
        wallet: originWallet,
        is_origin_wallet: true,
      });

      expect(portfolio).toHaveProperty('wallet');
      expect(portfolio).toHaveProperty('status');

      console.log('✓ Retrieved portfolio by origin wallet');
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Transaction History', () => {
    it('should get transaction history', async () => {
      const history = await giza.agent.getTransactions({
        wallet: smartAccount,
        page: 1,
        limit: 20,
      });

      // Verify response structure
      expect(history).toHaveProperty('transactions');
      expect(history).toHaveProperty('pagination');
      expect(Array.isArray(history.transactions)).toBe(true);

      // Verify pagination structure
      expect(history.pagination).toHaveProperty('total_items');
      expect(history.pagination).toHaveProperty('total_pages');
      expect(history.pagination).toHaveProperty('current_page');
      expect(history.pagination).toHaveProperty('items_per_page');

      console.log('\n========================================');
      console.log('Transaction History');
      console.log('========================================');
      console.log(`  Total Transactions: ${history.pagination.total_items}`);
      console.log(`  Current Page: ${history.pagination.current_page}`);
      console.log(`  Total Pages: ${history.pagination.total_pages}`);

      // Show recent transactions
      if (history.transactions.length > 0) {
        console.log('\n  Recent Transactions:');
        history.transactions.slice(0, 5).forEach((tx, index) => {
          console.log(
            `    ${index + 1}. ${tx.action} - ${tx.amount} ${tx.token_type} (${tx.status})`
          );
        });
      }
      console.log('========================================\n');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should get transactions with sorting', async () => {
      const historyAsc = await giza.agent.getTransactions({
        wallet: smartAccount,
        page: 1,
        limit: 10,
        sort: SortOrder.DATE_ASC,
      });

      const historyDesc = await giza.agent.getTransactions({
        wallet: smartAccount,
        page: 1,
        limit: 10,
        sort: SortOrder.DATE_DESC,
      });

      expect(historyAsc.transactions).toBeDefined();
      expect(historyDesc.transactions).toBeDefined();

      // If there are multiple transactions, verify sorting
      if (historyAsc.transactions.length > 1) {
        const firstAsc = new Date(historyAsc.transactions[0].date);
        const lastAsc = new Date(
          historyAsc.transactions[historyAsc.transactions.length - 1].date
        );
        expect(firstAsc.getTime()).toBeLessThanOrEqual(lastAsc.getTime());
      }

      if (historyDesc.transactions.length > 1) {
        const firstDesc = new Date(historyDesc.transactions[0].date);
        const lastDesc = new Date(
          historyDesc.transactions[historyDesc.transactions.length - 1].date
        );
        expect(firstDesc.getTime()).toBeGreaterThanOrEqual(lastDesc.getTime());
      }

      console.log('✓ Transaction sorting verified');
    }, E2E_TIMEOUTS.MEDIUM);

    it('should handle pagination correctly', async () => {
      const page1 = await giza.agent.getTransactions({
        wallet: smartAccount,
        page: 1,
        limit: 5,
      });

      expect(page1.pagination.current_page).toBe(1);
      expect(page1.pagination.items_per_page).toBe(5);

      // If there are more pages, test page 2
      if (page1.pagination.total_pages > 1) {
        const page2 = await giza.agent.getTransactions({
          wallet: smartAccount,
          page: 2,
          limit: 5,
        });

        expect(page2.pagination.current_page).toBe(2);
        console.log('✓ Pagination working correctly');
      }
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Deposit History', () => {
    it('should get deposit history', async () => {
      const deposits = await giza.agent.getDeposits(smartAccount);

      expect(deposits).toHaveProperty('deposits');
      expect(Array.isArray(deposits.deposits)).toBe(true);

      // Should have at least one deposit (from activation)
      expect(deposits.deposits.length).toBeGreaterThan(0);

      console.log(`✓ Found ${deposits.deposits.length} deposits`);

      deposits.deposits.forEach((deposit, index) => {
        expect(deposit).toHaveProperty('amount');
        expect(deposit).toHaveProperty('token_type');

        console.log(
          `  ${index + 1}. Amount: ${deposit.amount}, Token: ${deposit.token_type}`
        );
      });
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Fee Information', () => {
    it('should get fee information', async () => {
      const fees = await giza.agent.getFees(smartAccount);

      expect(fees).toHaveProperty('percentage_fee');
      expect(fees).toHaveProperty('fee');

      expect(typeof fees.percentage_fee).toBe('number');
      expect(typeof fees.fee).toBe('number');

      console.log(`✓ Fee information retrieved`);
      console.log(`  Percentage Fee: ${fees.percentage_fee * 100}%`);
      console.log(`  Fee Amount: ${fees.fee}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });

  describe('Deposit Limit', () => {
    it('should get deposit limit', async () => {
      const originWallet = sharedContext.get().originWallet!;

      const limitResponse = await giza.agent.getLimit({
        wallet: smartAccount,
        origin_wallet: originWallet,
      });

      expect(limitResponse).toHaveProperty('limit');
      expect(typeof limitResponse.limit).toBe('number');

      console.log(`✓ Deposit limit: ${limitResponse.limit}`);
    }, E2E_TIMEOUTS.MEDIUM);
  });
});

