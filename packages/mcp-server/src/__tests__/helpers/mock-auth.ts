import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

export const TEST_WALLET =
  '0x1234567890abcdef1234567890abcdef12345678' as const;
export const TEST_PRIVY_USER = 'privy-user-123';
export const TEST_CLIENT_ID = 'test-client-id';
export const TEST_SCOPES = ['mcp:tools'];

function makeFakePrivyIdToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: TEST_PRIVY_USER,
    iss: 'privy.io',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  return `${header}.${payload}.fake-signature`;
}

export const TEST_PRIVY_ID_TOKEN = makeFakePrivyIdToken();

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
      privyIdToken: TEST_PRIVY_ID_TOKEN,
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
