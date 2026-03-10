import { describe, test, expect, mock, beforeEach } from 'bun:test';

// Set required env vars before importing modules that read them
process.env.PRIVY_APP_ID = 'test-privy-app-id';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

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
  res.send = mock((body: any) => res);
  res.setHeader = mock((name: string, value: string) => res);
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
 * Extracts the session ID (state) from the HTML response body
 * by parsing the __GIZA_LOGIN_CONFIG__ JSON.
 */
function extractStateFromHtml(html: string): string {
  const match = html.match(
    /window\.__GIZA_LOGIN_CONFIG__=(.+?);<\/script>/,
  );
  if (!match?.[1]) {
    throw new Error('Could not extract config from HTML');
  }
  const config = JSON.parse(match[1]);
  return config.state as string;
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

  const htmlBody = authRes.send.mock.calls[0]![0] as string;
  const sessionId = extractStateFromHtml(htmlBody);

  const callbackHandler = provider.handlePrivyCallback();
  const callbackReq = createMockReq({
    body: {
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

  beforeEach(async () => {
    provider = new GizaAuthProvider(BASE_URL);
    await provider.clientsStore.registerClient(mockClient);
    mockVerifyPrivyToken.mockClear();
  });

  describe('authorize', () => {
    test('stores pending session and sends login HTML page', async () => {
      const res = createMockRes();
      const params = {
        state: 'oauth-state-123',
        codeChallenge: 'challenge-value',
        redirectUri: 'http://localhost/callback',
        scopes: TEST_SCOPES,
      };

      await provider.authorize(mockClient, params, res);

      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html',
      );
      const html = res.send.mock.calls[0]![0] as string;
      expect(html).toContain('<div id="root"></div>');
      expect(html).toContain('__GIZA_LOGIN_CONFIG__');
      expect(html).toContain('test-privy-app-id');

      const cspCall = res.setHeader.mock.calls.find(
        (c: string[]) => c[0] === 'Content-Security-Policy',
      );
      expect(cspCall).toBeTruthy();
      expect(cspCall![1]).toContain("script-src 'self' 'nonce-");
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
        body: { state: 'some-state' },
      });
      const res = createMockRes();

      await callbackHandler(req, res, mock());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 on missing state', async () => {
      const callbackHandler = provider.handlePrivyCallback();
      const req = createMockReq({
        body: { privy_token: 'token' },
      });
      const res = createMockRes();

      await callbackHandler(req, res, mock());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('callback returns generic error on internal failure', async () => {
      mockVerifyPrivyToken.mockImplementationOnce(() => {
        throw new Error('Detailed internal: DB connection refused at 10.0.0.5');
      });
      const callbackHandler = provider.handlePrivyCallback();
      const req = createMockReq({
        body: {
          privy_token: 'valid-privy-token',
          state: 'some-session-id',
        },
      });
      const res = createMockRes();

      await callbackHandler(req, res, mock());

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0]![0];
      expect(body.error).toBe('Authentication failed');
      expect(body.error).not.toContain('DB connection');
    });

    test('returns 400 on expired/invalid session', async () => {
      const callbackHandler = provider.handlePrivyCallback();
      const req = createMockReq({
        body: {
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

    test('rejects code from different client', async () => {
      const { code } = await runAuthFlow(provider);
      const otherClient = { client_id: 'other-client' } as any;

      await expect(
        provider.exchangeAuthorizationCode(otherClient, code),
      ).rejects.toThrow('Authorization code was not issued to this client');
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

    test('rejects scopes exceeding original grant', async () => {
      const { code } = await runAuthFlow(provider);
      const initial =
        await provider.exchangeAuthorizationCode(mockClient, code);

      await expect(
        provider.exchangeRefreshToken(
          mockClient,
          initial.refresh_token!,
          ['mcp:tools', 'admin:write'],
        ),
      ).rejects.toThrow('Requested scopes exceed original grant');
    });

    test('accepts same scopes', async () => {
      const { code } = await runAuthFlow(provider);
      const initial =
        await provider.exchangeAuthorizationCode(mockClient, code);

      const tokens = await provider.exchangeRefreshToken(
        mockClient,
        initial.refresh_token!,
        ['mcp:tools'],
      );

      expect(tokens.access_token).toBeTypeOf('string');
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

  describe('redirect URI validation', () => {
    test('rejects redirect to unregistered URI', async () => {
      // Register the client with known redirect URIs
      await provider.clientsStore.registerClient({
        client_id: TEST_CLIENT_ID,
        redirect_uris: ['http://localhost/callback'],
      } as any);

      // Authorize with a redirect URI not in the registered list
      const authRes = createMockRes();
      await provider.authorize(
        mockClient,
        {
          state: 'oauth-state',
          codeChallenge: 'challenge-value',
          redirectUri: 'http://evil.example.com/steal',
          scopes: TEST_SCOPES,
        },
        authRes,
      );

      const htmlBody = authRes.send.mock.calls[0]![0] as string;
      const sessionId = extractStateFromHtml(htmlBody);

      // Submit the callback with the session state
      const callbackHandler = provider.handlePrivyCallback();
      const callbackReq = createMockReq({
        body: {
          privy_token: 'valid-privy-token',
          state: sessionId,
        },
      });
      const callbackRes = createMockRes();
      await callbackHandler(callbackReq, callbackRes, mock());

      // Should return 400 because the redirect URI is not registered
      expect(callbackRes.status).toHaveBeenCalledWith(400);
      const body = callbackRes.json.mock.calls[0]![0];
      expect(body.error).toBe('Redirect URI not registered for client');
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

    test('rejects code from different client', async () => {
      const { code } = await runAuthFlow(provider);
      const otherClient = { client_id: 'other-client' } as any;

      await expect(
        provider.challengeForAuthorizationCode(otherClient, code),
      ).rejects.toThrow('Authorization code was not issued to this client');
    });
  });
});
