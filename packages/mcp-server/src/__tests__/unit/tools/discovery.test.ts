import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server.js';
import { createMockGiza } from '../../helpers/mock-sdk.js';

const mockGiza = createMockGiza();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(null),
}));

const { registerDiscoveryTools } = await import('../../../tools/discovery.js');

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

describe('discovery tools', () => {

  describe('giza_list_chains', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerDiscoveryTools(server as any);

      const result = await server.invokeTool('giza_list_chains', {}, {});

      expect(mockGiza.chains).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  describe('giza_list_tokens', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerDiscoveryTools(server as any);

      const result = await server.invokeTool(
        'giza_list_tokens',
        { chain: 8453 },
        {},
      );

      expect(mockGiza.tokens).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  describe('giza_list_protocols', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerDiscoveryTools(server as any);

      const result = await server.invokeTool(
        'giza_list_protocols',
        { chain: 8453, token: USDC_BASE },
        {},
      );

      expect(mockGiza.protocols).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  describe('giza_get_protocol_supply', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerDiscoveryTools(server as any);

      const result = await server.invokeTool(
        'giza_get_protocol_supply',
        { chain: 8453, token: USDC_BASE },
        {},
      );

      expect(mockGiza.protocolSupply).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });
});
