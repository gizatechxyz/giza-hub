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

mock.module('../../../services/confirmation.js', () => ({
  createPendingOperation: mock(
    () => 'mock-confirmation-token',
  ),
  confirmationPayload: mock(
    (type: string, desc: string, token: string) => ({
      status: 'confirmation_required',
      operation: type,
      confirmationToken: token,
    }),
  ),
  executePendingOperation: mock(() =>
    Promise.resolve({ type: 'withdraw', result: { status: 'ok' } }),
  ),
}));

const { registerFinancialTools } = await import(
  '../../../tools/financial.js'
);

describe('financial tools', () => {

  describe('giza_withdraw', () => {
    test('returns confirmation payload with auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_withdraw',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('confirmation_required');
      expect(parsed.confirmationToken).toBeDefined();
    });

    test('returns confirmation payload with amount', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_withdraw',
        { chain: 8453, amount: '1000' },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('confirmation_required');
      expect(parsed.confirmationToken).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_withdraw',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_withdrawal_status', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_get_withdrawal_status',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_get_withdrawal_status',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_fees', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_get_fees',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_get_fees',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_get_limit', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_get_limit',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerFinancialTools(server as any);

      const result = await server.invokeTool(
        'giza_get_limit',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
