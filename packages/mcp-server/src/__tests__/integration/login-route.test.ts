import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

const ORIGINAL_PRIVY_APP_ID = process.env.PRIVY_APP_ID;

beforeAll(() => {
  process.env.PRIVY_APP_ID = 'test-privy-app-id';
});

afterAll(() => {
  if (ORIGINAL_PRIVY_APP_ID !== undefined) {
    process.env.PRIVY_APP_ID = ORIGINAL_PRIVY_APP_ID;
  } else {
    delete process.env.PRIVY_APP_ID;
  }
});

const { GET } = await import('../../../app/api/login/route.js');

function makeRequest(query: string): Request {
  return new Request(`http://localhost:3000/api/login${query}`);
}

describe('GET /api/login', () => {
  test('valid UUID returns 200 with HTML', async () => {
    const uuid = crypto.randomUUID();
    const res = await GET(makeRequest(`?session=${uuid}`));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html');
    expect(res.headers.get('Content-Security-Policy')).toBeTruthy();

    const html = await res.text();
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('test-privy-app-id');
  });

  test('missing session parameter returns 400', async () => {
    const res = await GET(makeRequest(''));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing session parameter');
  });

  test('invalid UUID format returns 400', async () => {
    const res = await GET(makeRequest('?session=not-a-uuid'));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid session format');
  });

  test('SQL injection attempt returns 400', async () => {
    const res = await GET(
      makeRequest("?session='; DROP TABLE sessions; --"),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid session format');
  });

  test('missing PRIVY_APP_ID returns 500', async () => {
    const saved = process.env.PRIVY_APP_ID;
    delete process.env.PRIVY_APP_ID;

    try {
      const uuid = crypto.randomUUID();
      const res = await GET(makeRequest(`?session=${uuid}`));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Server misconfigured');
    } finally {
      process.env.PRIVY_APP_ID = saved;
    }
  });
});
