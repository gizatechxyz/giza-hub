import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

export const TEST_WALLET =
  '0x1234567890abcdef1234567890abcdef12345678' as const;
export const TEST_PRIVY_USER = 'privy-user-123';
export const TEST_CLIENT_ID = 'test-client-id';
export const TEST_SCOPES = ['mcp:tools'];

export function buildTestJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

function makeFakePrivyIdToken(): string {
  return buildTestJwt({
    sub: TEST_PRIVY_USER,
    iss: 'privy.io',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  });
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
      tokenIssuedAt: Math.floor(Date.now() / 1000),
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
