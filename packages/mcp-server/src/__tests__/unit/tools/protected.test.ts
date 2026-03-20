import { describe, test, expect, mock } from 'bun:test';
import { createTestServer } from '../../helpers/mock-server';
import { createMockGiza } from '../../helpers/mock-sdk';
import { buildExtra, buildUnauthExtra } from '../../helpers/mock-auth';

const mockGiza = createMockGiza();

mock.module('../../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(null),
}));

const { registerProtectedTools } = await import('../../../tools/protected.js');

describe('protected tools', () => {

  describe('giza_whoami', () => {
    test('returns wallet, privy, and scopes with valid auth', async () => {
      const server = createTestServer();
      registerProtectedTools(server as any);

      const result = await server.invokeTool(
        'giza_whoami',
        {},
        buildExtra(),
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.walletAddress).toBeDefined();
      expect(parsed.privyUserId).toBeDefined();
      expect(parsed.scopes).toBeDefined();
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerProtectedTools(server as any);

      const result = await server.invokeTool(
        'giza_whoami',
        {},
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('giza_logout', () => {
    test('revokes sessions and returns logged_out status', async () => {
      const server = createTestServer();
      registerProtectedTools(server as any);

      const logoutExtra = buildExtra({
        extra: {
          wallet: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
          privyUserId: 'privy-logout-test-user',
          privyIdToken: undefined,
        },
      });

      const result = await server.invokeTool(
        'giza_logout',
        {},
        logoutExtra,
      );

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('logged_out');
    });

    test('returns isError without auth', async () => {
      const server = createTestServer();
      registerProtectedTools(server as any);

      const result = await server.invokeTool(
        'giza_logout',
        {},
        buildUnauthExtra(),
      );

      expect(result.isError).toBe(true);
    });
  });
});
