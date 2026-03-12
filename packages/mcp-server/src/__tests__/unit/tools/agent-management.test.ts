import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server';
import { createMockGiza, createMockAgent } from '../../helpers/mock-sdk';
import { buildExtra, buildUnauthExtra } from '../../helpers/mock-auth';

const mockGiza = createMockGiza();
const mockAgent = createMockAgent();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(mockAgent),
}));

const { registerAgentManagementTools } = await import(
  '../../../tools/agent-management.js'
);

describe('agent-management tools', () => {

  describe('giza_create_agent', () => {
    test('calls giza.createAgent with auth', async () => {
      const server = createTestServer();
      registerAgentManagementTools(server as any);

      const result = await server.invokeTool(
        'giza_create_agent',
        { chain: 8453 },
        buildExtra(),
      );

      expect(mockGiza.createAgent).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerAgentManagementTools(server as any);

      const result = await server.invokeTool(
        'giza_create_agent',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_agent', () => {
    test('calls giza.getAgent with auth', async () => {
      const server = createTestServer();
      registerAgentManagementTools(server as any);

      const result = await server.invokeTool(
        'giza_get_agent',
        { chain: 8453 },
        buildExtra(),
      );

      expect(mockGiza.getAgent).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerAgentManagementTools(server as any);

      const result = await server.invokeTool(
        'giza_get_agent',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_smart_account', () => {
    test('calls giza.getSmartAccount with auth', async () => {
      const server = createTestServer();
      registerAgentManagementTools(server as any);

      const result = await server.invokeTool(
        'giza_get_smart_account',
        { chain: 8453 },
        buildExtra(),
      );

      expect(mockGiza.getSmartAccount).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerAgentManagementTools(server as any);

      const result = await server.invokeTool(
        'giza_get_smart_account',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
