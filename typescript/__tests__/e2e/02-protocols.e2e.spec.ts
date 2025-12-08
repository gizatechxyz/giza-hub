import { GizaAgent } from '../../src/client';
import { sharedContext } from './shared-context';
import {
  E2E_CONFIG,
  E2E_TIMEOUTS,
  BASE_TOKEN_ADDRESSES,
  validateE2EConfig,
} from './test-config';

describe('02 - Protocols', () => {
  let giza: GizaAgent;

  beforeAll(() => {
    validateE2EConfig();

    // Ensure smart account exists from previous test
    sharedContext.requireSmartAccount();

    giza = new GizaAgent({
      chainId: E2E_CONFIG.CHAIN_ID,
      agentId: E2E_CONFIG.AGENT_ID,
    });
  });

  describe('Get Available Protocols', () => {
    it('should get available protocols for USDC', async () => {
      const response = await giza.agent.getProtocols(BASE_TOKEN_ADDRESSES.USDC);

      // Verify response structure
      expect(response).toHaveProperty('protocols');
      expect(Array.isArray(response.protocols)).toBe(true);

      // Should have at least some protocols available
      expect(response.protocols.length).toBeGreaterThan(0);

      // Store protocols in shared context for activation
      sharedContext.setProtocols(response.protocols);

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
  });

  describe('Protocol Validation', () => {
    it('should return well-known DeFi protocols', async () => {
      const storedProtocols = sharedContext.requireProtocols();

      // Check for some commonly expected protocols on Base
      const wellKnownProtocols = [
        'aave',
        'compound',
        'moonwell',
        'morpho',
        'fluid',
        'euler',
      ];

      const foundProtocols = wellKnownProtocols.filter((known) =>
        storedProtocols.some((p) => p.toLowerCase().includes(known.toLowerCase()))
      );

      // Should have at least one well-known protocol
      expect(foundProtocols.length).toBeGreaterThan(0);

      console.log(`✓ Found ${foundProtocols.length} well-known protocols: ${foundProtocols.join(', ')}`);
    });

    it('should have protocols as non-empty strings', () => {
      const protocols = sharedContext.requireProtocols();

      protocols.forEach((protocol) => {
        expect(typeof protocol).toBe('string');
        expect(protocol.length).toBeGreaterThan(0);
        expect(protocol.trim()).toBe(protocol); // No leading/trailing whitespace
      });

      console.log('✓ All protocols have valid string format');
    });
  });

  describe('Context Verification', () => {
    it('should have protocols stored in shared context', () => {
      expect(sharedContext.hasProtocols()).toBe(true);

      const context = sharedContext.get();
      expect(context.protocols.length).toBeGreaterThan(0);
    });

    it('should have all required data for activation', () => {
      const context = sharedContext.get();

      expect(context.smartAccountAddress).toBeDefined();
      expect(context.originWallet).toBeDefined();
      expect(context.protocols.length).toBeGreaterThan(0);

      console.log('\n✓ All prerequisites for activation are ready:');
      console.log(`  Smart Account: ${context.smartAccountAddress}`);
      console.log(`  Origin Wallet: ${context.originWallet}`);
      console.log(`  Protocols: ${context.protocols.length} available\n`);
    });
  });
});

