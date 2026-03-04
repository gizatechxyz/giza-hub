import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server.js';
import {
  createMockGiza,
  createMockAgent,
} from '../../helpers/mock-sdk.js';
import { buildExtra, buildUnauthExtra } from '../../helpers/mock-auth.js';

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
    Promise.resolve({ type: 'claim_rewards', result: { claimed: true } }),
  ),
}));

const { registerRewardTools } = await import(
  '../../../tools/rewards.js'
);

describe('reward tools', () => {

  describe('giza_list_rewards', () => {
    test('returns paginated data with auth', async () => {
      const server = createTestServer();
      registerRewardTools(server as any);

      const result = await server.invokeTool(
        'giza_list_rewards',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerRewardTools(server as any);

      const result = await server.invokeTool(
        'giza_list_rewards',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_list_reward_history', () => {
    test('returns paginated data with auth', async () => {
      const server = createTestServer();
      registerRewardTools(server as any);

      const result = await server.invokeTool(
        'giza_list_reward_history',
        { chain: 8453 },
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerRewardTools(server as any);

      const result = await server.invokeTool(
        'giza_list_reward_history',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_claim_rewards', () => {
    test('returns confirmation payload with auth', async () => {
      const server = createTestServer();
      registerRewardTools(server as any);

      const result = await server.invokeTool(
        'giza_claim_rewards',
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
      registerRewardTools(server as any);

      const result = await server.invokeTool(
        'giza_claim_rewards',
        { chain: 8453 },
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
