import { describe, it, expect, beforeEach } from 'bun:test';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

import { checkAuth, ensureAuth, ensureAuthWithToken } from '../../../auth/ensure-auth';
import { storePrivyToken } from '../../../auth/session';
import { buildTestJwt } from '../../helpers/mock-auth';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

const WALLET = '0x' + 'aB'.repeat(20);
const PRIVY_USER = 'privy:ensure-auth-test';

function makeExtra(authInfo?: {
  extra?: Record<string, unknown>;
  scopes?: string[];
  clientId?: string;
}): ToolExtra {
  return {
    authInfo,
    sessionId: 'test-session',
  } as unknown as ToolExtra;
}

function validAuthInfo() {
  return {
    extra: {
      wallet: WALLET,
      privyUserId: PRIVY_USER,
      tokenIssuedAt: Math.floor(Date.now() / 1000),
    },
    scopes: ['mcp:tools'],
    clientId: 'client-1',
  };
}

describe('checkAuth', () => {
  it('returns AuthContext when authInfo is present', () => {
    const result = checkAuth(makeExtra(validAuthInfo()));
    expect(result).toMatchObject({
      walletAddress: WALLET,
      privyUserId: PRIVY_USER,
      scopes: ['mcp:tools'],
      clientId: 'client-1',
    });
    expect(result!.privyIdToken).toBeUndefined();
  });

  it('returns null when no authInfo', () => {
    const result = checkAuth(makeExtra());
    expect(result).toBeNull();
  });
});

describe('ensureAuth', () => {
  it('returns AuthContext when authenticated', async () => {
    const result = await ensureAuth(makeExtra(validAuthInfo()));
    expect(result.walletAddress).toBe(WALLET);
  });

  it('throws when unauthenticated', async () => {
    await expect(ensureAuth(makeExtra())).rejects.toThrow('Not authenticated');
  });
});

describe('ensureAuthWithToken', () => {
  const VALID_TOKEN = buildTestJwt({
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  beforeEach(async () => {
    await storePrivyToken(PRIVY_USER, VALID_TOKEN);
  });

  it('returns AuthContext with privyIdToken from Redis', async () => {
    const result = await ensureAuthWithToken(makeExtra(validAuthInfo()));
    expect(result.privyIdToken).toBe(VALID_TOKEN);
  });

  it('throws when Privy token is missing from store', async () => {
    const unknownUser = 'privy:unknown-user-xyz';
    const extra = makeExtra({
      extra: {
        wallet: WALLET,
        privyUserId: unknownUser,
        tokenIssuedAt: Math.floor(Date.now() / 1000),
      },
      scopes: ['mcp:tools'],
      clientId: 'client-1',
    });

    await expect(
      ensureAuthWithToken(extra),
    ).rejects.toThrow('Identity token is missing or expired');
  });

  it('throws when Privy token is expired', async () => {
    const expiredUser = 'privy:expired-token-user';
    const expiredToken = buildTestJwt({
      exp: Math.floor(Date.now() / 1000) - 100,
    });
    await storePrivyToken(expiredUser, expiredToken);

    const extra = makeExtra({
      extra: {
        wallet: WALLET,
        privyUserId: expiredUser,
        tokenIssuedAt: Math.floor(Date.now() / 1000),
      },
      scopes: ['mcp:tools'],
      clientId: 'client-1',
    });

    await expect(
      ensureAuthWithToken(extra),
    ).rejects.toThrow('Identity token is missing or expired');
  });
});
