import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server';
import {
  createMockGiza,
  createMockAgent,
} from '../../helpers/mock-sdk';
import { buildExtra, buildUnauthExtra } from '../../helpers/mock-auth';

const mockGiza = createMockGiza();
const mockAgent = createMockAgent();

const mockExecutePending = mock(() =>
  Promise.resolve({ type: 'withdraw', result: { status: 'ok' } }),
);

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(mockAgent),
}));

mock.module('../../../services/confirmation.js', () => ({
  executePendingOperation: mockExecutePending,
}));

const { registerCriticalTools } = await import(
  '../../../tools/critical.js'
);

describe('critical tools', () => {

  describe('giza_confirm_operation', () => {
    test('calls executePendingOperation with valid token and auth', async () => {
      const server = createTestServer();
      registerCriticalTools(server as any);

      const result = await server.invokeTool(
        'giza_confirm_operation',
        { confirmationToken: 'test-token-123' },
        buildExtra(),
      );

      expect(mockExecutePending).toHaveBeenCalled();
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerCriticalTools(server as any);

      const result = await server.invokeTool(
        'giza_confirm_operation',
        { confirmationToken: 'test-token-123' },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });

    test('returns isError when executePendingOperation throws', async () => {
      mockExecutePending.mockImplementationOnce(() =>
        Promise.reject(new Error('Invalid or expired token')),
      );

      const server = createTestServer();
      registerCriticalTools(server as any);

      const result = await server.invokeTool(
        'giza_confirm_operation',
        { confirmationToken: 'expired-token' },
        buildExtra(),
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        'Invalid or expired token',
      );
    });
  });
});
