import { describe, test, expect, beforeAll } from 'bun:test';

// Set required env vars before importing session module
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

import * as jose from 'jose';
import {
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  revokeUserSessions,
} from '../../../auth/session';
import { ACCESS_TOKEN_TTL_SEC } from '../../../constants';
import {
  TEST_WALLET,
  TEST_PRIVY_USER,
  TEST_CLIENT_ID,
  TEST_SCOPES,
} from '../../helpers/mock-auth';

const TOKEN_INPUT = {
  privyUserId: TEST_PRIVY_USER,
  walletAddress: TEST_WALLET,
  clientId: TEST_CLIENT_ID,
  scopes: TEST_SCOPES,
} as const;

describe('createTokenPair', () => {
  test('returns accessToken, refreshToken, and expiresIn', async () => {
    const result = await createTokenPair(TOKEN_INPUT);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.expiresIn).toBe(ACCESS_TOKEN_TTL_SEC);
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.accessToken.length).toBeGreaterThan(0);
    expect(result.refreshToken.length).toBeGreaterThan(0);
  });

  test('accessToken and refreshToken are different', async () => {
    const result = await createTokenPair(TOKEN_INPUT);
    expect(result.accessToken).not.toBe(result.refreshToken);
  });
});

describe('verifyAccessToken', () => {
  test('round-trip: create then verify returns correct AuthInfo', async () => {
    const { accessToken } = await createTokenPair(TOKEN_INPUT);
    const authInfo = await verifyAccessToken(accessToken);

    expect(authInfo.token).toBe(accessToken);
    expect(authInfo.clientId).toBe(TEST_CLIENT_ID);
    expect(authInfo.scopes).toEqual(TEST_SCOPES);
    expect(authInfo.extra).toBeDefined();
    expect((authInfo.extra as Record<string, unknown>).wallet).toBe(
      TEST_WALLET,
    );
    expect(
      (authInfo.extra as Record<string, unknown>).privyUserId,
    ).toBe(TEST_PRIVY_USER);
  });

  test('rejects a refresh token', async () => {
    const { refreshToken } = await createTokenPair(TOKEN_INPUT);

    await expect(verifyAccessToken(refreshToken)).rejects.toThrow(
      'cannot be used as access tokens',
    );
  });

  test('rejects a garbage token', async () => {
    await expect(
      verifyAccessToken('not-a-real-token'),
    ).rejects.toThrow();
  });
});

describe('JWT audience claim', () => {
  test('access token contains aud claim', async () => {
    const { accessToken } = await createTokenPair(TOKEN_INPUT);
    const decoded = jose.decodeJwt(accessToken);
    expect(decoded.aud).toBe('giza-mcp');
  });

  test('rejects token with wrong audience', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const wrongAudToken = await new jose.SignJWT({
      wallet: TEST_WALLET,
      clientId: TEST_CLIENT_ID,
      scopes: TEST_SCOPES,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(TEST_PRIVY_USER)
      .setIssuer('giza-mcp-server')
      .setAudience('wrong-audience')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifyAccessToken(wrongAudToken)).rejects.toThrow();
  });
});

describe('verifyRefreshToken', () => {
  test('round-trip: create then verify returns correct claims', async () => {
    const { refreshToken } = await createTokenPair(TOKEN_INPUT);
    const claims = await verifyRefreshToken(refreshToken);

    expect(claims.type).toBe('refresh');
    expect(claims.wallet).toBe(TEST_WALLET);
    expect(claims.sub).toBe(TEST_PRIVY_USER);
    expect(claims.clientId).toBe(TEST_CLIENT_ID);
    expect(claims.scopes).toEqual(TEST_SCOPES);
  });

  test('preserves privyIdToken through refresh', async () => {
    const privyIdToken = 'test-privy-id-token';
    const { refreshToken } = await createTokenPair({
      ...TOKEN_INPUT,
      privyIdToken,
    });
    const claims = await verifyRefreshToken(refreshToken);
    expect(claims.privyIdToken).toBe(privyIdToken);
  });

  test('rejects an access token', async () => {
    const { accessToken } = await createTokenPair(TOKEN_INPUT);

    await expect(verifyRefreshToken(accessToken)).rejects.toThrow(
      'Expected a refresh token',
    );
  });

  test('rejects a garbage token', async () => {
    await expect(
      verifyRefreshToken('not-a-real-token'),
    ).rejects.toThrow();
  });
});

function buildMinimalJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('dynamic TTL (getPrivyTokenExp via createTokenPair)', () => {
  test('caps TTL when Privy token expires before default', async () => {
    const now = Math.floor(Date.now() / 1000);
    const privyIdToken = buildMinimalJwt({ exp: now + 1200 }); // 20 min
    const result = await createTokenPair({
      ...TOKEN_INPUT,
      privyIdToken,
    });
    // 20min - 5min buffer = 900s max
    expect(result.expiresIn).toBeLessThanOrEqual(900);
    expect(result.expiresIn).toBeGreaterThan(0);
  });

  test('uses default TTL when Privy token has no exp', async () => {
    const privyIdToken = buildMinimalJwt({ sub: 'user' }); // no exp
    const result = await createTokenPair({
      ...TOKEN_INPUT,
      privyIdToken,
    });
    expect(result.expiresIn).toBe(ACCESS_TOKEN_TTL_SEC);
  });

  test('uses default TTL when privyIdToken is not a valid JWT', async () => {
    const result = await createTokenPair({
      ...TOKEN_INPUT,
      privyIdToken: 'not-a-jwt',
    });
    expect(result.expiresIn).toBe(ACCESS_TOKEN_TTL_SEC);
  });

  test('uses default TTL when Privy token exp is far in the future', async () => {
    const now = Math.floor(Date.now() / 1000);
    const privyIdToken = buildMinimalJwt({ exp: now + 7200 }); // 2 hours
    const result = await createTokenPair({
      ...TOKEN_INPUT,
      privyIdToken,
    });
    expect(result.expiresIn).toBe(ACCESS_TOKEN_TTL_SEC);
  });
});

describe('revokeUserSessions', () => {
  test('revoked access token is rejected', async () => {
    const { accessToken } = await createTokenPair(TOKEN_INPUT);
    await revokeUserSessions(TEST_PRIVY_USER);
    await expect(verifyAccessToken(accessToken)).rejects.toThrow('Session revoked');
  });

  test('revoked refresh token is rejected', async () => {
    const { refreshToken } = await createTokenPair(TOKEN_INPUT);
    await revokeUserSessions(TEST_PRIVY_USER);
    await expect(verifyRefreshToken(refreshToken)).rejects.toThrow('Session revoked');
  });

  test('tokens created after revocation are accepted', async () => {
    await revokeUserSessions(TEST_PRIVY_USER);
    const futureIat = Math.floor(Date.now() / 1000) + 2;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const futureToken = await new jose.SignJWT({
      wallet: TEST_WALLET,
      clientId: TEST_CLIENT_ID,
      scopes: TEST_SCOPES,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(TEST_PRIVY_USER)
      .setIssuer('giza-mcp-server')
      .setAudience('giza-mcp')
      .setIssuedAt(futureIat)
      .setExpirationTime(futureIat + 3600)
      .sign(secret);
    const authInfo = await verifyAccessToken(futureToken);
    expect(authInfo.clientId).toBe(TEST_CLIENT_ID);
  });

  test('revocation for one user does not affect another', async () => {
    const otherUser = 'privy-user-other';
    const otherInput = { ...TOKEN_INPUT, privyUserId: otherUser };
    const { accessToken } = await createTokenPair(otherInput);
    await revokeUserSessions(TEST_PRIVY_USER);
    const authInfo = await verifyAccessToken(accessToken);
    expect((authInfo.extra as Record<string, unknown>).privyUserId).toBe(otherUser);
  });

  test('double logout is idempotent', async () => {
    const { accessToken } = await createTokenPair(TOKEN_INPUT);
    await revokeUserSessions(TEST_PRIVY_USER);
    await revokeUserSessions(TEST_PRIVY_USER);
    await expect(verifyAccessToken(accessToken)).rejects.toThrow('Session revoked');
  });
});
