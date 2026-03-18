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
      privyUserId: 'privy:123',
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
    expect(result).toEqual({
      walletAddress: WALLET,
      privyUserId: 'privy:123',
      scopes: ['mcp:tools'],
      clientId: 'client-1',
      privyIdToken: 'token-abc',
    });
  });

  it('returns null when no authInfo', () => {
    const result = checkAuth(makeExtra());
    expect(result).toBeNull();
  });
});

describe('ensureAuth', () => {
  it('returns AuthContext when authenticated', () => {
    const result = ensureAuth(makeExtra(validAuthInfo()));
    expect(result.walletAddress).toBe(WALLET);
  });

  it('throws when unauthenticated', () => {
    expect(() => ensureAuth(makeExtra())).toThrow('Not authenticated');
  });
});

describe('ensureAuthWithToken', () => {
  it('returns AuthContext when privyIdToken is present', () => {
    const result = ensureAuthWithToken(
      makeExtra(validAuthInfo({ privyIdToken: 'token-abc' })),
    );
    expect(result.privyIdToken).toBe('token-abc');
  });

  it('throws when privyIdToken is absent', () => {
    expect(() =>
      ensureAuthWithToken(makeExtra(validAuthInfo())),
    ).toThrow('Session does not include an identity token');
  });
});
