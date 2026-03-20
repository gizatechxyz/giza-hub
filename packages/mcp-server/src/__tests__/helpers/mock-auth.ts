import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { storePrivyToken } from '../../auth/session';

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

const TEST_PRIVY_ID_TOKEN = buildTestJwt({
  sub: TEST_PRIVY_USER,
  iss: 'privy.io',
  exp: Math.floor(Date.now() / 1000) + 36000,
  iat: Math.floor(Date.now() / 1000),
});

await storePrivyToken(TEST_PRIVY_USER, TEST_PRIVY_ID_TOKEN);

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
