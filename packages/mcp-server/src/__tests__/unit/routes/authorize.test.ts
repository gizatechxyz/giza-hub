import { describe, test, expect, mock, beforeEach } from 'bun:test';

process.env.PRIVY_APP_ID = 'test-privy-app-id';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

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

const { GET } = await import('../../../../app/authorize/route.js');
const { RedisClientsStore } = await import(
  '../../../auth/redis-clients-store.js'
);

const store = new RedisClientsStore();

const TEST_CLIENT_ID = 'authorize-test-client';
const TEST_REDIRECT_URI = 'http://localhost/callback';

function makeUrl(params: Record<string, string>): string {
  const url = new URL('http://localhost:3000/authorize');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function makeRequest(params: Record<string, string>): Request {
  return new Request(makeUrl(params));
}

const validParams: Record<string, string> = {
  client_id: TEST_CLIENT_ID,
  redirect_uri: TEST_REDIRECT_URI,
  response_type: 'code',
  code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  code_challenge_method: 'S256',
  state: 'random-state',
};

describe('GET /authorize', () => {
  beforeEach(async () => {
    await store.registerClient({
      client_id: TEST_CLIENT_ID,
      redirect_uris: [TEST_REDIRECT_URI],
      client_id_issued_at: Math.floor(Date.now() / 1000),
    } as any);
  });

  test('valid params returns HTML', async () => {
    const res = await GET(makeRequest(validParams));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html');
    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe(
      'same-origin-allow-popups',
    );
    const html = await res.text();
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('test-privy-app-id');
  });

  test('missing client_id returns 400', async () => {
    const { client_id: _, ...rest } = validParams;
    const res = await GET(makeRequest(rest));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('client_id');
  });

  test('unknown client_id returns 400', async () => {
    const res = await GET(
      makeRequest({ ...validParams, client_id: 'unknown' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('Unknown');
  });

  test('missing redirect_uri returns 400', async () => {
    const { redirect_uri: _, ...rest } = validParams;
    const res = await GET(makeRequest(rest));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('redirect_uri');
  });

  test('unregistered redirect_uri returns 400', async () => {
    const res = await GET(
      makeRequest({ ...validParams, redirect_uri: 'http://evil.com/steal' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('not registered');
  });

  test('wrong response_type returns 400', async () => {
    const res = await GET(
      makeRequest({ ...validParams, response_type: 'token' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('unsupported_response_type');
  });

  test('missing code_challenge returns 400', async () => {
    const { code_challenge: _, ...rest } = validParams;
    const res = await GET(makeRequest(rest));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('code_challenge');
  });

  test('wrong code_challenge_method returns 400', async () => {
    const res = await GET(
      makeRequest({ ...validParams, code_challenge_method: 'plain' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_request');
    expect(body.error_description).toContain('S256');
  });
});
