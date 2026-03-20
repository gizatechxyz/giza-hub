import * as jose from 'jose';
import type { Address } from '@gizatech/agent-sdk';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import {
  ENV_JWT_SECRET,
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
  PRIVY_TOKEN_EXP_BUFFER_SEC,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from '../constants';
import type { GizaTokenClaims } from './types';

function initSecret(): Uint8Array {
  const raw = process.env[ENV_JWT_SECRET];
  if (!raw || raw.length < 32) {
    throw new Error(
      'JWT secret not configured or too short. Check environment configuration.',
    );
  }
  return new TextEncoder().encode(raw);
}

let cachedSecret: Uint8Array | undefined;

function getSecret(): Uint8Array {
  if (!cachedSecret) {
    cachedSecret = initSecret();
  }
  return cachedSecret;
}

interface TokenInput {
  privyUserId: string;
  walletAddress: Address;
  clientId: string;
  scopes: string[];
  privyIdToken?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function buildJwt(
  payload: Record<string, unknown>,
  sub: string,
  ttl: number,
  secret: Uint8Array,
  now: number,
): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .setJti(crypto.randomUUID())
    .sign(secret);
}

function getPrivyTokenExp(token: string): number | undefined {
  try {
    const { exp } = jose.decodeJwt(token);
    return typeof exp === 'number' ? exp : undefined;
  } catch {
    return undefined;
  }
}

export async function createTokenPair(
  input: TokenInput,
): Promise<TokenPair> {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);

  let ttl = ACCESS_TOKEN_TTL_SEC;
  if (input.privyIdToken) {
    const exp = getPrivyTokenExp(input.privyIdToken);
    if (exp) {
      const remaining = exp - now - PRIVY_TOKEN_EXP_BUFFER_SEC;
      if (remaining > 0) {
        ttl = Math.min(ttl, remaining);
      }
    }
  }

  const basePayload = {
    wallet: input.walletAddress,
    clientId: input.clientId,
    scopes: input.scopes,
    privyIdToken: input.privyIdToken,
  };

  const [accessToken, refreshToken] = await Promise.all([
    buildJwt(basePayload, input.privyUserId, ttl, secret, now),
    buildJwt(
      { ...basePayload, type: 'refresh' },
      input.privyUserId,
      REFRESH_TOKEN_TTL_SEC,
      secret,
      now,
    ),
  ]);

  return { accessToken, refreshToken, expiresIn: ttl };
}

async function decodeToken(
  token: string,
): Promise<GizaTokenClaims & jose.JWTPayload> {
  const secret = getSecret();
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['HS256'],
  });
  const claims = payload as unknown as GizaTokenClaims & jose.JWTPayload;
  if (!claims.sub) {
    throw new Error('JWT missing subject claim');
  }
  return claims;
}

export async function verifyAccessToken(token: string): Promise<AuthInfo> {
  const claims = await decodeToken(token);
  if (claims.type === 'refresh') {
    throw new Error('Refresh tokens cannot be used as access tokens');
  }

  return {
    token,
    clientId: claims.clientId,
    scopes: claims.scopes,
    expiresAt: claims.exp,
    extra: {
      wallet: claims.wallet,
      privyUserId: claims.sub,
      privyIdToken: claims.privyIdToken,
    },
  };
}

export async function verifyRefreshToken(
  token: string,
): Promise<GizaTokenClaims> {
  const claims = await decodeToken(token);
  if (claims.type !== 'refresh') {
    throw new Error('Expected a refresh token');
  }

  return {
    sub: claims.sub,
    wallet: claims.wallet,
    clientId: claims.clientId,
    scopes: claims.scopes,
    privyIdToken: claims.privyIdToken,
    type: 'refresh',
  };
}
