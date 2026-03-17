import { mock } from 'bun:test';

process.env['GIZA_API_URL'] = 'https://api.test.giza.tech';
process.env['PRIVY_APP_ID'] = 'test-privy-app-id';
process.env['JWT_SECRET'] =
  'test-jwt-secret-that-is-at-least-32-characters-long';
process.env['MCP_DOMAIN'] = 'http://127.0.0.1:3000';

mock.module('@privy-io/node', () => {
  const mockGetUser = mock(() =>
    Promise.resolve({
      id: 'privy-user-123',
      linked_accounts: [
        {
          type: 'wallet',
          chain_type: 'ethereum',
          address: '0x1234567890abcdef1234567890abcdef12345678',
        },
      ],
    }),
  );
  return {
    PrivyClient: class MockPrivyClient {
      users() {
        return { get: mockGetUser };
      }
    },
  };
});
