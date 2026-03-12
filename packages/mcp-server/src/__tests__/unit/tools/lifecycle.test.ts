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

const { registerLifecycleTools } = await import(
  '../../../tools/lifecycle.js'
);

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

describe('lifecycle tools', () => {

  describe('giza_activate_agent', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_activate_agent',
        {
          chain: 8453,
          token: USDC_BASE,
          protocols: ['aave'],
          txHash: '0xabc',
        },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_activate_agent',
        {
          chain: 8453,
          token: USDC_BASE,
          protocols: ['aave'],
          txHash: '0xabc',
        },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_deactivate_agent', () => {
    test('returns confirmation payload with auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_deactivate_agent',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('confirmation_required');
      expect(parsed.confirmationToken).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_deactivate_agent',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_top_up', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_top_up',
        { chain: 8453, txHash: '0xabc' },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_top_up',
        { chain: 8453, txHash: '0xabc' },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_run_agent', () => {
    test('succeeds with auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_run_agent',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerLifecycleTools(server as any);

      const result = await server.invokeTool(
        'giza_run_agent',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
