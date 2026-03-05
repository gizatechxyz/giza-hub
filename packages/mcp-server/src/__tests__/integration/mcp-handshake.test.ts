import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMockGiza } from '../helpers/mock-sdk.js';
import {
  TEST_WALLET,
  TEST_PRIVY_USER,
  TEST_CLIENT_ID,
  TEST_SCOPES,
} from '../helpers/mock-auth.js';

// Set required env vars before importing modules that read them
process.env.PRIVY_APP_ID = 'test-privy-app-id';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

const mockGiza = createMockGiza();

mock.module('../../services/sdk-factory.js', () => ({
  getDefaultGizaClient: () => mockGiza,
  getGizaClient: () => mockGiza,
  getAgentForSession: () => Promise.resolve(mockGiza),
}));

const { createTokenPair } = await import('../../auth/session.js');
const { createApp } = await import('../../index.js');

describe('MCP handshake integration', () => {
  let server: Server;
  let baseUrl: string;
  let validToken: string;

  beforeAll(async () => {
    const app = createApp(0);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const pair = await createTokenPair({
      privyUserId: TEST_PRIVY_USER,
      walletAddress: TEST_WALLET,
      clientId: TEST_CLIENT_ID,
      scopes: TEST_SCOPES,
    });
    validToken = pair.accessToken;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test('health endpoint returns ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  test('POST /mcp without auth returns 401 with WWW-Authenticate', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    });
    expect(res.status).toBe(401);
    const wwwAuth = res.headers.get('www-authenticate');
    expect(wwwAuth).toContain('resource_metadata=');
    expect(wwwAuth).toContain('.well-known/oauth-protected-resource');
  });

  test('POST /mcp without initialize request returns 400', async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
    });
    expect(res.status).toBe(400);
  });

  test('MCP initialize handshake succeeds', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    };

    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(initRequest),
    });

    expect(res.status).toBe(200);
    const sessionId = res.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();
  });

  test('full MCP session: initialize then list tools', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    };

    const initRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(initRequest),
    });

    expect(initRes.status).toBe(200);
    const sessionId = initRes.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();

    // Send notifications/initialized then tools/list
    const notifyRequest = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    };

    const listRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    };

    const listRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId!,
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify([notifyRequest, listRequest]),
    });

    expect(listRes.status).toBe(200);
    const text = await listRes.text();
    expect(text).toContain('giza_health');
  });

  test('full MCP session: call giza_health tool', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    };

    const initRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(initRequest),
    });

    const sessionId = initRes.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();

    // Send initialized notification first
    await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId!,
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });

    // Call giza_health tool
    const callRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId!,
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'giza_health', arguments: {} },
      }),
    });

    expect(callRes.status).toBe(200);
    const text = await callRes.text();
    expect(text).toContain('healthy');
  });
});
