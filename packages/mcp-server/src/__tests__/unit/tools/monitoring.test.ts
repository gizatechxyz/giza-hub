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

const { registerMonitoringTools } = await import(
  '../../../tools/monitoring.js'
);

describe('monitoring tools', () => {

  describe('giza_get_portfolio', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_portfolio',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_portfolio',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_performance', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_performance',
        { chain: 8453, from: '2025-01-01' },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_performance',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_apr', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_apr',
        {
          chain: 8453,
          startDate: '2025-01-01',
          endDate: '2025-06-01',
        },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_apr',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_apr_by_tokens', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_apr_by_tokens',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_apr_by_tokens',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_deposits', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_deposits',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerMonitoringTools(server as any);

      const result = await server.invokeTool(
        'giza_get_deposits',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
