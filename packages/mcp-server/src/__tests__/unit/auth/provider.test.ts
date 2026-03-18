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
    privyIdToken: string;
  }>,
): Promise<{ code: string; redirectUrl: string }> {
  const authParams = {
    state: params?.state ?? 'oauth-state',
    codeChallenge: params?.codeChallenge ?? 'challenge-value',
    redirectUri:
      params?.redirectUri ?? 'http://localhost/callback',
    scopes: params?.scopes ?? TEST_SCOPES,
  };
  const authorizeResult = await provider.authorize(mockClient, authParams);

  const sessionId = extractStateFromHtml(authorizeResult.html);

  const callbackResult = await provider.handlePrivyCallback({
    privyIdToken: params?.privyIdToken ?? 'valid-identity-token',
    state: sessionId,
  });

  if (callbackResult.type !== 'redirect') {
    throw new Error(`Expected redirect, got ${callbackResult.type}`);
  }

  const finalUrl = new URL(callbackResult.url);
  const code = finalUrl.searchParams.get('code')!;

  return { code, redirectUrl: callbackResult.url };
}

describe('GizaAuthProvider', () => {
  let provider: InstanceType<typeof GizaAuthProvider>;

  beforeEach(async () => {
    provider = new GizaAuthProvider(BASE_URL);
    await provider.clientsStore.registerClient(mockClient);
    mockVerifyPrivyToken.mockClear();
  });

  describe('authorize', () => {
    test('stores pending session and returns login HTML page', async () => {
      const params = {
        state: 'oauth-state-123',
        codeChallenge: 'challenge-value',
        redirectUri: 'http://localhost/callback',
        scopes: TEST_SCOPES,
      };

      const result = await provider.authorize(mockClient, params);

      expect(result.headers['Content-Type']).toBe('text/html');
      expect(result.headers['Content-Security-Policy']).toContain(
        "script-src 'self' 'nonce-",
      );
      expect(result.html).toContain('<div id="root"></div>');
      expect(result.html).toContain('__GIZA_LOGIN_CONFIG__');
      expect(result.html).toContain('test-privy-app-id');
    });
  });

  describe('handlePrivyCallback', () => {
    test('creates auth code and redirects with code and state', async () => {
      const { redirectUrl } = await runAuthFlow(provider, {
        state: 'oauth-state-456',
      });

      expect(mockVerifyPrivyToken).toHaveBeenCalledWith(
        'valid-identity-token',
      );
      expect(redirectUrl).toContain('code=');
      expect(redirectUrl).toContain('state=oauth-state-456');
    });

    test('returns error on missing identity token', async () => {
      const result = await provider.handlePrivyCallback({
        state: 'some-state',
      });

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.status).toBe(400);
      }
    });

    test('returns error on missing state', async () => {
      const result = await provider.handlePrivyCallback({
        privyIdToken: 'identity-token',
      });

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.status).toBe(400);
      }
    });

    test('callback returns generic error on internal failure', async () => {
      mockVerifyPrivyToken.mockImplementationOnce(() => {
        throw new Error('Detailed internal: DB connection refused at 10.0.0.5');
      });

      const result = await provider.handlePrivyCallback({
        privyIdToken: 'valid-identity-token',
        state: 'some-session-id',
      });

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.status).toBe(500);
        expect(result.body.error).toBe('Authentication failed');
        expect(result.body.error).not.toContain('DB connection');
      }
    });

    test('returns error on expired/invalid session', async () => {
      const result = await provider.handlePrivyCallback({
        privyIdToken: 'valid-identity-token',
        state: 'nonexistent-session-id',
      });

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.status).toBe(400);
      }
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

    test('accepts matching redirectUri', async () => {
      const { code } = await runAuthFlow(provider, {
        redirectUri: 'http://localhost/callback',
      });

      const tokens = await provider.exchangeAuthorizationCode(
        mockClient,
        code,
        'http://localhost/callback',
      );

      expect(tokens.access_token).toBeTypeOf('string');
    });

    test('rejects mismatched redirectUri', async () => {
      const { code } = await runAuthFlow(provider, {
        redirectUri: 'http://localhost/callback',
      });

      await expect(
        provider.exchangeAuthorizationCode(
          mockClient,
          code,
          'http://evil.example.com/steal',
        ),
      ).rejects.toThrow('Redirect URI mismatch');
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
      await provider.clientsStore.registerClient({
        client_id: TEST_CLIENT_ID,
        redirect_uris: ['http://localhost/callback'],
      } as any);

      const authorizeResult = await provider.authorize(
        mockClient,
        {
          state: 'oauth-state',
          codeChallenge: 'challenge-value',
          redirectUri: 'http://evil.example.com/steal',
          scopes: TEST_SCOPES,
        },
      );

      const sessionId = extractStateFromHtml(authorizeResult.html);

      const callbackResult = await provider.handlePrivyCallback({
        privyIdToken: 'valid-identity-token',
        state: sessionId,
      });

      expect(callbackResult.type).toBe('error');
      if (callbackResult.type === 'error') {
        expect(callbackResult.status).toBe(400);
        expect(callbackResult.body.error).toBe(
          'Redirect URI not registered for client',
        );
      }
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
