import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server.js';
import { createMockGiza } from '../../helpers/mock-sdk.js';

const mockGiza = createMockGiza();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(null),
}));

const { registerOptimizerTools } = await import(
  '../../../tools/optimizer.js'
);

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

describe('optimizer tools', () => {

  describe('giza_optimize', () => {
    test('calls giza.optimize with correct params', async () => {
      const server = createTestServer();
      registerOptimizerTools(server as any);

      const result = await server.invokeTool(
        'giza_optimize',
        {
          token: USDC_BASE,
          capital: '1000000',
          currentAllocations: { aave: '500000' },
          protocols: ['aave', 'compound'],
        },
        {},
      );

      expect(mockGiza.optimize).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });
});
