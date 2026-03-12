import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server';
import {
  createMockGiza,
  createMockAgent,
  mockPaginator,
} from '../../helpers/mock-sdk';
import { buildExtra, buildUnauthExtra } from '../../helpers/mock-auth';

const mockGiza = createMockGiza();
const mockAgent = createMockAgent();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(mockAgent),
}));

const { registerTransactionTools } = await import(
  '../../../tools/transactions.js'
);

describe('transaction tools', () => {

  describe('giza_list_transactions', () => {
    test('returns paginated data with auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_transactions',
        { chain: 8453, page: 1, limit: 10 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_transactions',
        { chain: 8453, page: 1, limit: 10 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_list_executions', () => {
    test('returns paginated data with auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_executions',
        { chain: 8453, page: 1, limit: 10 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_executions',
        { chain: 8453, page: 1, limit: 10 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_list_execution_logs', () => {
    test('returns paginated data with auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_execution_logs',
        {
          chain: 8453,
          executionId: 'exec-123',
          page: 1,
          limit: 10,
        },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_execution_logs',
        {
          chain: 8453,
          executionId: 'exec-123',
          page: 1,
          limit: 10,
        },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_list_logs', () => {
    test('returns paginated data with auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_logs',
        { chain: 8453, page: 1, limit: 10 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerTransactionTools(server as any);

      const result = await server.invokeTool(
        'giza_list_logs',
        { chain: 8453, page: 1, limit: 10 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
