import { describe, test, expect, mock } from 'bun:test';

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

const { POST } = await import('../../../../app/register/route.js');

function makeRequest(body: unknown, contentType = 'application/json'): Request {
  return new Request('http://localhost:3000/register', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: JSON.stringify(body),
  });
}

describe('POST /register', () => {
  test('valid metadata returns 201 with client info', async () => {
    const res = await POST(
      makeRequest({
        redirect_uris: ['http://localhost/callback'],
        client_name: 'Test Client',
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.client_id).toBeTypeOf('string');
    expect(body.client_id_issued_at).toBeTypeOf('number');
    expect(body.redirect_uris).toEqual(['http://localhost/callback']);
    expect(body.client_name).toBe('Test Client');
  });

  test('public client has no client_secret', async () => {
    const res = await POST(
      makeRequest({
        redirect_uris: ['http://localhost/callback'],
        token_endpoint_auth_method: 'none',
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.client_secret).toBeUndefined();
  });

  test('confidential client gets client_secret', async () => {
    const res = await POST(
      makeRequest({
        redirect_uris: ['http://localhost/callback'],
        token_endpoint_auth_method: 'client_secret_post',
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.client_secret).toBeTypeOf('string');
    expect(body.client_secret.length).toBeGreaterThan(0);
    expect(body.client_secret_expires_at).toBe(0);
  });

  test('missing redirect_uris returns 400', async () => {
    const res = await POST(
      makeRequest({ client_name: 'No URIs' }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_client_metadata');
  });

  test('non-JSON content type returns 400', async () => {
    const res = await POST(
      new Request('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{}',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_client_metadata');
    expect(body.error_description).toContain('application/json');
  });

  test('invalid JSON body returns 400', async () => {
    const res = await POST(
      new Request('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_client_metadata');
  });
});
