import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server';
import {
  createMockGiza,
  createMockAgent,
} from '../../helpers/mock-sdk';
import { buildExtra, buildUnauthExtra } from '../../helpers/mock-auth';

const mockGiza = createMockGiza();
const mockAgent = createMockAgent();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(mockAgent),
}));

const { registerProtocolTools } = await import(
  '../../../tools/protocols.js'
);

describe('protocol tools', () => {

  describe('giza_get_agent_protocols', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_get_agent_protocols',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_get_agent_protocols',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_update_protocols', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_update_protocols',
        { chain: 8453, protocols: ['aave', 'compound'] },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_update_protocols',
        { chain: 8453, protocols: ['aave', 'compound'] },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_constraints', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_get_constraints',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_get_constraints',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_update_constraints', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_update_constraints',
        {
          chain: 8453,
          constraints: [
            { kind: 'min_protocols', params: { value: 2 } },
          ],
        },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerProtocolTools(server as any);

      const result = await server.invokeTool(
        'giza_update_constraints',
        {
          chain: 8453,
          constraints: [
            { kind: 'min_protocols', params: { value: 2 } },
          ],
        },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
