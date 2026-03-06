import { describe, test, expect, beforeAll } from 'bun:test';

// Set required env vars before importing session module
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

import * as jose from 'jose';
import {
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../auth/session.js';
import {
  TEST_WALLET,
  TEST_PRIVY_USER,
  TEST_CLIENT_ID,
  TEST_SCOPES,
} from '../../helpers/mock-auth.js';

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
    expect(result.expiresIn).toBe(3600);
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
