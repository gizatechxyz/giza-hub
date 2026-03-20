import type { Address } from '@gizatech/agent-sdk';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

export interface PendingAuthSession {
  clientId: string;
  redirectUri: string;
  state?: string;
  codeChallenge: string;
  scopes: string[];
  createdAt: number;
}

export interface PendingAuthCode {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  privyUserId: string;
  walletAddress: Address;
  privyIdToken?: string;
  createdAt: number;
}

export interface GizaTokenClaims {
  sub: string;
  wallet: Address;
  clientId: string;
  scopes: string[];
  privyIdToken?: string;
  type?: 'refresh';
  iat?: number;
}

export interface AuthContext {
  walletAddress: Address;
  privyUserId: string;
  scopes: string[];
  clientId: string;
  privyIdToken?: string;
  tokenIssuedAt?: number;
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function parseWalletAddress(value: string): Address {
  if (!ADDRESS_RE.test(value)) {
    throw new Error(`Invalid wallet address format: ${value}`);
  }
  return value as Address;
}

export function extractAuthContext(
  authInfo?: AuthInfo,
): AuthContext | undefined {
  if (!authInfo?.extra) return undefined;

  const { wallet, privyUserId, privyIdToken, tokenIssuedAt } = authInfo.extra as Record<
    string,
    unknown
  >;
  if (typeof wallet !== 'string' || typeof privyUserId !== 'string') {
    return undefined;
  }

  return {
    walletAddress: parseWalletAddress(wallet),
    privyUserId,
    scopes: authInfo.scopes,
    clientId: authInfo.clientId,
    privyIdToken:
      typeof privyIdToken === 'string' ? privyIdToken : undefined,
    tokenIssuedAt: typeof tokenIssuedAt === 'number' ? tokenIssuedAt : undefined,
  };
}
