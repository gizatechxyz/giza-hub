import { describe, test, expect, mock } from 'bun:test';
import { createHash } from 'node:crypto';
import { ACCESS_TOKEN_TTL_SEC } from '../../constants';

process.env.PRIVY_APP_ID = 'test-privy-app-id';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';
process.env.MCP_DOMAIN = 'http://localhost:3000';

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_PRIVY_USER = 'privy-user-123';

const storage = new Map<string, string>();
const mockRedisClient = {
  set: mock((key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve('OK');
  }),
  get: mock((key: string) => Promise.resolve(storage.get(key) ?? null)),
  exists: mock((key: string) => Promise.resolve(storage.has(key) ? 1 : 0)),
  del: mock((key: string) => {
    const had = storage.has(key);
    storage.delete(key);
    return Promise.resolve(had ? 1 : 0);
  }),
};

mock.module('../../utils/redis-client.js', () => ({
  getRedisClient: () => Promise.resolve(mockRedisClient),
}));

mock.module('../../auth/privy.js', () => ({
  verifyPrivyToken: () =>
    Promise.resolve({
      privyUserId: TEST_PRIVY_USER,
      walletAddress: TEST_WALLET,
    }),
}));

const { POST: registerPost } = await import(
  '../../../app/register/route.js'
);
const { GET: authorizeGet } = await import(
  '../../../app/authorize/route.js'
);
const { POST: tokenPost } = await import(
  '../../../app/token/route.js'
);
const { GizaAuthProvider } = await import('../../auth/provider.js');
const { verifyAccessToken } = await import('../../auth/session.js');

const CODE_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CODE_CHALLENGE = createHash('sha256')
  .update(CODE_VERIFIER)
  .digest('base64url');

function extractStateFromHtml(html: string): string {
  const match = html.match(
    /window\.__GIZA_LOGIN_CONFIG__=(.+?);<\/script>/,
  );
  if (!match?.[1]) throw new Error('Could not extract config from HTML');
  return JSON.parse(match[1]).state as string;
}

describe('Full OAuth PKCE flow', () => {
  test('register -> authorize -> callback -> token -> verify', async () => {
    // Step 1: Dynamic client registration
    const registerRes = await registerPost(
      new Request('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: ['http://localhost/callback'],
          client_name: 'Integration Test Client',
          token_endpoint_auth_method: 'none',
        }),
      }),
    );

    expect(registerRes.status).toBe(201);
    const clientInfo = await registerRes.json();
    const clientId = clientInfo.client_id;
    expect(clientId).toBeTypeOf('string');

    // Step 2: Authorization request
    const authorizeUrl = new URL('http://localhost:3000/authorize');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', 'http://localhost/callback');
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('code_challenge', CODE_CHALLENGE);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    authorizeUrl.searchParams.set('state', 'integration-test-state');

    const authorizeRes = await authorizeGet(
      new Request(authorizeUrl.toString()),
    );

    expect(authorizeRes.status).toBe(200);
    const html = await authorizeRes.text();
    const sessionId = extractStateFromHtml(html);

    // Step 3: Simulate Privy callback (would normally happen in the browser)
    const provider = new GizaAuthProvider('http://localhost:3000');
    const callbackResult = await provider.handlePrivyCallback({
      privyIdToken: 'valid-identity-token',
      state: sessionId,
    });

    expect(callbackResult.type).toBe('html');
    if (callbackResult.type !== 'html') throw new Error('Expected html');

    const iframeSrcMatch = callbackResult.html.match(/iframe[^>]+src="([^"]+)"/);
    expect(iframeSrcMatch).toBeTruthy();
    const iframeSrc = iframeSrcMatch![1]!.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    const redirectUrl = new URL(iframeSrc);
    const authCode = redirectUrl.searchParams.get('code')!;
    expect(authCode).toBeTypeOf('string');
    expect(redirectUrl.searchParams.get('state')).toBe(
      'integration-test-state',
    );

    // Step 4: Token exchange
    const tokenRes = await tokenPost(
      new Request('http://localhost:3000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code: authCode,
          code_verifier: CODE_VERIFIER,
          redirect_uri: 'http://localhost/callback',
        }).toString(),
      }),
    );

    expect(tokenRes.status).toBe(200);
    const tokens = await tokenRes.json();
    expect(tokens.access_token).toBeTypeOf('string');
    expect(tokens.refresh_token).toBeTypeOf('string');
    expect(tokens.token_type).toBe('Bearer');
    expect(tokens.expires_in).toBeLessThanOrEqual(ACCESS_TOKEN_TTL_SEC);

    // Step 5: Verify the access token works
    const authInfo = await verifyAccessToken(tokens.access_token);
    expect(authInfo.clientId).toBe(clientId);
    expect(authInfo.scopes).toContain('mcp:tools');
    expect((authInfo.extra as any).wallet).toBe(TEST_WALLET);

    // Step 6: Refresh token
    const refreshRes = await tokenPost(
      new Request('http://localhost:3000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          refresh_token: tokens.refresh_token,
        }).toString(),
      }),
    );

    expect(refreshRes.status).toBe(200);
    const newTokens = await refreshRes.json();
    expect(newTokens.access_token).toBeTypeOf('string');
    expect(newTokens.refresh_token).toBeTypeOf('string');

    // Verify the refreshed token also works
    const refreshedAuth = await verifyAccessToken(newTokens.access_token);
    expect(refreshedAuth.clientId).toBe(clientId);
  });
});
