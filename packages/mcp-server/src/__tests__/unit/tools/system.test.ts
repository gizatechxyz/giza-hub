import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server';
import { createMockGiza } from '../../helpers/mock-sdk';

const mockGiza = createMockGiza();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(null),
}));

const { registerSystemTools } = await import('../../../tools/system.js');

describe('system tools', () => {

  describe('giza_health', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerSystemTools(server as any);

      const result = await server.invokeTool('giza_health', {}, {});

      expect(mockGiza.health).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  describe('giza_get_config', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerSystemTools(server as any);

      const result = await server.invokeTool('giza_get_config', {}, {});

      expect(mockGiza.getApiConfig).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

  describe('giza_get_stats', () => {
    test('calls correct SDK method and returns JSON', async () => {
      const server = createTestServer();
      registerSystemTools(server as any);

      const result = await server.invokeTool(
        'giza_get_stats',
        { chain: 8453 },
        {},
      );

      expect(mockGiza.stats).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });
  });

});
