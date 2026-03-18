import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { createHash } from 'node:crypto';

process.env.PRIVY_APP_ID = 'test-privy-app-id';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

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

mock.module('../../../utils/redis-client.js', () => ({
  getRedisClient: () => Promise.resolve(mockRedisClient),
}));

mock.module('../../../auth/privy.js', () => ({
  verifyPrivyToken: () =>
    Promise.resolve({
      privyUserId: TEST_PRIVY_USER,
      walletAddress: TEST_WALLET,
    }),
}));

const { POST } = await import('../../../../app/token/route.js');
const { GizaAuthProvider } = await import('../../../auth/provider.js');

const BASE_URL = 'http://localhost:3000';
const TEST_CLIENT_ID = 'token-test-client';
const TEST_REDIRECT_URI = 'http://localhost/callback';
const CODE_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CODE_CHALLENGE = createHash('sha256')
  .update(CODE_VERIFIER)
  .digest('base64url');

function makeTokenRequest(params: Record<string, string>): Request {
  const body = new URLSearchParams(params);
  return new Request('http://localhost:3000/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

function extractStateFromHtml(html: string): string {
  const match = html.match(
    /window\.__GIZA_LOGIN_CONFIG__=(.+?);<\/script>/,
  );
  if (!match?.[1]) throw new Error('Could not extract config from HTML');
  return JSON.parse(match[1]).state as string;
}

async function getAuthCode(
  provider: InstanceType<typeof GizaAuthProvider>,
): Promise<string> {
  const mockClient = {
    client_id: TEST_CLIENT_ID,
    redirect_uris: [TEST_REDIRECT_URI],
  } as any;

  await provider.clientsStore.registerClient!(mockClient);

  const authorizeResult = await provider.authorize(mockClient, {
    state: 'test-state',
    codeChallenge: CODE_CHALLENGE,
    redirectUri: TEST_REDIRECT_URI,
    scopes: ['mcp:tools'],
  });

  const sessionId = extractStateFromHtml(authorizeResult.html);
  const callbackResult = await provider.handlePrivyCallback({
    privyIdToken: 'valid-identity-token',
    state: sessionId,
  });

  if (callbackResult.type !== 'html') {
    throw new Error(`Expected html, got ${callbackResult.type}`);
  }

  const iframeSrcMatch = callbackResult.html.match(/iframe[^>]+src="([^"]+)"/);
  if (!iframeSrcMatch) throw new Error('No iframe src found in success page');
  const redirectUrl = iframeSrcMatch[1]!.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  const url = new URL(redirectUrl);
  return url.searchParams.get('code')!;
}

describe('POST /token', () => {
  let provider: InstanceType<typeof GizaAuthProvider>;

  beforeEach(() => {
    provider = new GizaAuthProvider(BASE_URL);
  });

  test('wrong content type returns 400', async () => {
    const res = await POST(
      new Request('http://localhost:3000/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
  });

  test('missing client_id returns 400', async () => {
    const res = await POST(
      makeTokenRequest({ grant_type: 'authorization_code' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_client');
  });

  test('unknown client returns 401', async () => {
    const res = await POST(
      makeTokenRequest({
        grant_type: 'authorization_code',
        client_id: 'nonexistent',
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('invalid_client');
  });

  test('unsupported grant_type returns 400', async () => {
    await provider.clientsStore.registerClient!({
      client_id: TEST_CLIENT_ID,
      redirect_uris: [TEST_REDIRECT_URI],
    } as any);

    const res = await POST(
      makeTokenRequest({
        grant_type: 'client_credentials',
        client_id: TEST_CLIENT_ID,
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('unsupported_grant_type');
  });

  test('Cache-Control: no-store is set on responses', async () => {
    const res = await POST(
      makeTokenRequest({
        grant_type: 'authorization_code',
        client_id: 'nonexistent',
      }),
    );

    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  describe('authorization_code grant', () => {
    test('valid code exchange returns tokens', async () => {
      const code = await getAuthCode(provider);

      const res = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code,
          code_verifier: CODE_VERIFIER,
          redirect_uri: TEST_REDIRECT_URI,
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.access_token).toBeTypeOf('string');
      expect(body.refresh_token).toBeTypeOf('string');
      expect(body.token_type).toBe('Bearer');
      expect(body.expires_in).toBe(3600);
    });

    test('PKCE failure returns 400', async () => {
      const code = await getAuthCode(provider);

      const res = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code,
          code_verifier: 'wrong-verifier',
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_grant');
      expect(body.error_description).toContain('PKCE');
    });

    test('missing code returns 400', async () => {
      await provider.clientsStore.registerClient!({
        client_id: TEST_CLIENT_ID,
        redirect_uris: [TEST_REDIRECT_URI],
      } as any);

      const res = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code_verifier: CODE_VERIFIER,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_request');
    });

    test('missing code_verifier returns 400', async () => {
      await provider.clientsStore.registerClient!({
        client_id: TEST_CLIENT_ID,
        redirect_uris: [TEST_REDIRECT_URI],
      } as any);

      const res = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code: 'some-code',
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_request');
    });

    test('invalid code returns 400', async () => {
      await provider.clientsStore.registerClient!({
        client_id: TEST_CLIENT_ID,
        redirect_uris: [TEST_REDIRECT_URI],
      } as any);

      const res = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code: 'invalid-code',
          code_verifier: CODE_VERIFIER,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_grant');
    });
  });

  describe('refresh_token grant', () => {
    test('valid refresh returns new tokens', async () => {
      const code = await getAuthCode(provider);

      const tokenRes = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code,
          code_verifier: CODE_VERIFIER,
        }),
      );
      const tokens = await tokenRes.json();

      const res = await POST(
        makeTokenRequest({
          grant_type: 'refresh_token',
          client_id: TEST_CLIENT_ID,
          refresh_token: tokens.refresh_token,
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.access_token).toBeTypeOf('string');
      expect(body.refresh_token).toBeTypeOf('string');
      expect(body.token_type).toBe('Bearer');
    });

    test('missing refresh_token returns 400', async () => {
      await provider.clientsStore.registerClient!({
        client_id: TEST_CLIENT_ID,
        redirect_uris: [TEST_REDIRECT_URI],
      } as any);

      const res = await POST(
        makeTokenRequest({
          grant_type: 'refresh_token',
          client_id: TEST_CLIENT_ID,
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_request');
    });

    test('scope escalation returns 400', async () => {
      const code = await getAuthCode(provider);

      const tokenRes = await POST(
        makeTokenRequest({
          grant_type: 'authorization_code',
          client_id: TEST_CLIENT_ID,
          code,
          code_verifier: CODE_VERIFIER,
        }),
      );
      const tokens = await tokenRes.json();

      const res = await POST(
        makeTokenRequest({
          grant_type: 'refresh_token',
          client_id: TEST_CLIENT_ID,
          refresh_token: tokens.refresh_token,
          scope: 'mcp:tools admin:write',
        }),
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_grant');
    });
  });
});
