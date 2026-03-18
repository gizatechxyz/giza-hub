import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

const ORIGINAL_PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const ORIGINAL_MCP_DOMAIN = process.env.MCP_DOMAIN;

beforeAll(() => {
  process.env.PRIVY_APP_ID = 'test-privy-app-id';
  process.env.MCP_DOMAIN = 'https://mcp.example.com';
});

afterAll(() => {
  if (ORIGINAL_PRIVY_APP_ID !== undefined) {
    process.env.PRIVY_APP_ID = ORIGINAL_PRIVY_APP_ID;
  } else {
    delete process.env.PRIVY_APP_ID;
  }
  if (ORIGINAL_MCP_DOMAIN !== undefined) {
    process.env.MCP_DOMAIN = ORIGINAL_MCP_DOMAIN;
  } else {
    delete process.env.MCP_DOMAIN;
  }
});

const { GET } = await import(
  '../../../../app/.well-known/oauth-authorization-server/route.js'
);

describe('GET /.well-known/oauth-authorization-server', () => {
  test('returns correct metadata structure', async () => {
    const res = GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.issuer).toBe('https://mcp.example.com');
    expect(body.authorization_endpoint).toBe('https://mcp.example.com/authorize');
    expect(body.token_endpoint).toBe('https://mcp.example.com/token');
    expect(body.registration_endpoint).toBe('https://mcp.example.com/register');
    expect(body.response_types_supported).toEqual(['code']);
    expect(body.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
    expect(body.code_challenge_methods_supported).toEqual(['S256']);
    expect(body.token_endpoint_auth_methods_supported).toEqual(['none', 'client_secret_post']);
    expect(body.scopes_supported).toEqual(['mcp:tools']);
  });
});
