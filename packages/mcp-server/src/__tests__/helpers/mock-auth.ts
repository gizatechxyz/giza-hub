import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

export const TEST_WALLET =
  '0x1234567890abcdef1234567890abcdef12345678' as const;
export const TEST_PRIVY_USER = 'privy-user-123';
export const TEST_CLIENT_ID = 'test-client-id';
export const TEST_SCOPES = ['mcp:tools'];

export function buildAuthInfo(
  overrides?: Partial<AuthInfo>,
): AuthInfo {
  return {
    token: 'test-access-token',
    clientId: TEST_CLIENT_ID,
    scopes: TEST_SCOPES,
    extra: {
      wallet: TEST_WALLET,
      privyUserId: TEST_PRIVY_USER,
    },
    ...overrides,
  };
}

export function buildExtra(overrides?: Partial<AuthInfo>) {
  return { authInfo: buildAuthInfo(overrides) };
}

export function buildUnauthExtra() {
  return { authInfo: undefined };
}
