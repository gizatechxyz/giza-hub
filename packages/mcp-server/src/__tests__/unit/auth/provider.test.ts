import { describe, test, expect, mock, beforeEach } from 'bun:test';

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_PRIVY_USER = 'privy-user-123';
const TEST_CLIENT_ID = 'test-client';
const TEST_SCOPES = ['mcp:tools'];

const mockVerifyPrivyToken = mock(() =>
  Promise.resolve({
    privyUserId: TEST_PRIVY_USER,
    walletAddress: TEST_WALLET,
  }),
);

mock.module('../../../auth/privy.js', () => ({
  verifyPrivyToken: mockVerifyPrivyToken,
}));

const { GizaAuthProvider } = await import(
  '../../../auth/provider.js'
);

const BASE_URL = 'http://localhost:3000';
const mockClient = {
  client_id: TEST_CLIENT_ID,
  redirect_uris: ['http://localhost/callback'],
} as any;

function createMockRes() {
  const res: any = {};
  res.redirect = mock((url: string) => {});
  res.status = mock((code: number) => res);
  res.json = mock((body: any) => res);
  return res;
}

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    query: {},
    headers: {},
    ...overrides,
  } as any;
}

/**
 * Runs the full authorize -> callback flow and returns the
 * authorization code extracted from the final redirect URL.
 */
async function runAuthFlow(
  provider: InstanceType<typeof GizaAuthProvider>,
  params?: Partial<{
    state: string;
    codeChallenge: string;
    redirectUri: string;
    scopes: string[];
    privyToken: string;
  }>,
): Promise<{ code: string; redirectUrl: string }> {
  const authRes = createMockRes();
  const authParams = {
    state: params?.state ?? 'oauth-state',
    codeChallenge: params?.codeChallenge ?? 'challenge-value',
    redirectUri:
      params?.redirectUri ?? 'http://localhost/callback',
    scopes: params?.scopes ?? TEST_SCOPES,
  };
  await provider.authorize(mockClient, authParams, authRes);

  const loginRedirectUrl =
    authRes.redirect.mock.calls[0]![0] as string;
  const url = new URL(loginRedirectUrl);
  const sessionId = url.searchParams.get('state')!;

  const callbackHandler = provider.handlePrivyCallback();
  const callbackReq = createMockReq({
    query: {
      privy_token: params?.privyToken ?? 'valid-privy-token',
      state: sessionId,
    },
  });
  const callbackRes = createMockRes();
  await callbackHandler(callbackReq, callbackRes, mock());

  const finalRedirect =
    callbackRes.redirect.mock.calls[0]![0] as string;
  const finalUrl = new URL(finalRedirect);
  const code = finalUrl.searchParams.get('code')!;

  return { code, redirectUrl: finalRedirect };
}

describe('GizaAuthProvider', () => {
  let provider: InstanceType<typeof GizaAuthProvider>;

  beforeEach(() => {
    provider = new GizaAuthProvider(BASE_URL);
    mockVerifyPrivyToken.mockClear();
  });

  describe('authorize', () => {
    test('stores pending session and redirects to Privy', async () => {
      const res = createMockRes();
      const params = {
        state: 'oauth-state-123',
        codeChallenge: 'challenge-value',
        redirectUri: 'http://localhost/callback',
        scopes: TEST_SCOPES,
      };

      await provider.authorize(mockClient, params, res);

      expect(res.redirect).toHaveBeenCalledTimes(1);
      const redirectUrl =
        res.redirect.mock.calls[0]![0] as string;
      expect(redirectUrl).toContain('auth.privy.io');
      expect(redirectUrl).toContain('redirectUrl=');
    });
  });

  describe('handlePrivyCallback', () => {
    test('creates auth code and redirects with code and state', async () => {
      const { redirectUrl } = await runAuthFlow(provider, {
        state: 'oauth-state-456',
      });

      expect(mockVerifyPrivyToken).toHaveBeenCalledWith(
        'valid-privy-token',
      );
      expect(redirectUrl).toContain('code=');
      expect(redirectUrl).toContain('state=oauth-state-456');
    });

    test('returns 400 on missing privy_token', async () => {
      const callbackHandler = provider.handlePrivyCallback();
      const req = createMockReq({
        query: { state: 'some-state' },
      });
      const res = createMockRes();

      await callbackHandler(req, res, mock());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 on missing state', async () => {
      const callbackHandler = provider.handlePrivyCallback();
      const req = createMockReq({
        query: { privy_token: 'token' },
      });
      const res = createMockRes();

      await callbackHandler(req, res, mock());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 on expired/invalid session', async () => {
      const callbackHandler = provider.handlePrivyCallback();
      const req = createMockReq({
        query: {
          privy_token: 'valid-privy-token',
          state: 'nonexistent-session-id',
        },
      });
      const res = createMockRes();

      await callbackHandler(req, res, mock());

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('exchangeAuthorizationCode', () => {
    test('returns OAuthTokens with expected fields', async () => {
      const { code } = await runAuthFlow(provider);
      const tokens =
        await provider.exchangeAuthorizationCode(
          mockClient,
          code,
        );

      expect(tokens.access_token).toBeTypeOf('string');
      expect(tokens.access_token.length).toBeGreaterThan(0);
      expect(tokens.refresh_token).toBeTypeOf('string');
      expect(tokens.refresh_token.length).toBeGreaterThan(0);
      expect(tokens.expires_in).toBe(3600);
      expect(tokens.token_type).toBe('Bearer');
      expect(tokens.scope).toBe('mcp:tools');
    });

    test('code is single-use (second call throws)', async () => {
      const { code } = await runAuthFlow(provider);
      await provider.exchangeAuthorizationCode(mockClient, code);

      await expect(
        provider.exchangeAuthorizationCode(mockClient, code),
      ).rejects.toThrow('Invalid authorization code');
    });

    test('throws on invalid code', async () => {
      await expect(
        provider.exchangeAuthorizationCode(
          mockClient,
          'invalid-code',
        ),
      ).rejects.toThrow('Invalid authorization code');
    });
  });

  describe('exchangeRefreshToken', () => {
    test('returns new tokens from refresh token claims', async () => {
      const { code } = await runAuthFlow(provider);
      const initial =
        await provider.exchangeAuthorizationCode(
          mockClient,
          code,
        );

      const tokens = await provider.exchangeRefreshToken(
        mockClient,
        initial.refresh_token!,
        TEST_SCOPES,
      );

      expect(tokens.access_token).toBeTypeOf('string');
      expect(tokens.access_token.length).toBeGreaterThan(0);
      expect(tokens.refresh_token).toBeTypeOf('string');
      expect(tokens.token_type).toBe('Bearer');
      expect(tokens.expires_in).toBe(3600);
    });
  });

  describe('verifyAccessToken', () => {
    test('delegates to session.verifyAccessToken', async () => {
      const { code } = await runAuthFlow(provider);
      const tokens =
        await provider.exchangeAuthorizationCode(
          mockClient,
          code,
        );

      const result = await provider.verifyAccessToken(
        tokens.access_token,
      );

      expect(result.token).toBe(tokens.access_token);
      expect(result.clientId).toBe(TEST_CLIENT_ID);
      expect(result.scopes).toEqual(TEST_SCOPES);
    });
  });

  describe('challengeForAuthorizationCode', () => {
    test('returns codeChallenge for valid code', async () => {
      const { code } = await runAuthFlow(provider, {
        codeChallenge: 'the-challenge-value',
      });

      const challenge =
        await provider.challengeForAuthorizationCode(
          mockClient,
          code,
        );

      expect(challenge).toBe('the-challenge-value');
    });

    test('throws for invalid code', async () => {
      await expect(
        provider.challengeForAuthorizationCode(
          mockClient,
          'bad-code',
        ),
      ).rejects.toThrow('Invalid authorization code');
    });
  });
});
