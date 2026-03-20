import { describe, it, expect } from 'bun:test';
import { checkAuth, ensureAuth, ensureAuthWithToken } from '../../../auth/ensure-auth';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

const WALLET = '0x' + 'aB'.repeat(20);

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

function validAuthInfo(overrides?: { privyIdToken?: string }) {
  return {
    extra: {
      wallet: WALLET,
      privyUserId: 'privy:ensure-auth-test',
      privyIdToken: overrides?.privyIdToken,
    },
    scopes: ['mcp:tools'],
    clientId: 'client-1',
  };
}

describe('checkAuth', () => {
  it('returns AuthContext when authInfo is present', () => {
    const result = checkAuth(
      makeExtra(validAuthInfo({ privyIdToken: 'token-abc' })),
    );
    expect(result).toMatchObject({
      walletAddress: WALLET,
      privyUserId: 'privy:ensure-auth-test',
      scopes: ['mcp:tools'],
      clientId: 'client-1',
      privyIdToken: 'token-abc',
    });
    expect(result!.tokenIssuedAt).toBeUndefined();
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
  it('returns AuthContext when privyIdToken is present', async () => {
    const result = await ensureAuthWithToken(
      makeExtra(validAuthInfo({ privyIdToken: 'token-abc' })),
    );
    expect(result.privyIdToken).toBe('token-abc');
  });

  it('throws when privyIdToken is absent', async () => {
    await expect(
      ensureAuthWithToken(makeExtra(validAuthInfo())),
    ).rejects.toThrow('Session does not include an identity token');
  });
});
