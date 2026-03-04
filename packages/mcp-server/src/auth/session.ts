import * as jose from 'jose';
import type { Address } from '@gizatech/agent-sdk';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import {
  ENV_JWT_SECRET,
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
  JWT_ISSUER,
} from '../constants.js';
import type { GizaTokenClaims } from './types.js';

function initSecret(): Uint8Array {
  const raw = process.env[ENV_JWT_SECRET];
  if (!raw || raw.length < 32) {
    throw new Error(
      `${ENV_JWT_SECRET} must be set and at least 32 characters`,
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
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .setJti(crypto.randomUUID())
    .sign(secret);
}

export async function createTokenPair(
  input: TokenInput,
): Promise<TokenPair> {
  const secret = getSecret();
  const basePayload = {
    wallet: input.walletAddress,
    clientId: input.clientId,
    scopes: input.scopes,
  };

  const [accessToken, refreshToken] = await Promise.all([
    buildJwt(basePayload, input.privyUserId, ACCESS_TOKEN_TTL_SEC, secret),
    buildJwt(
      { ...basePayload, type: 'refresh' },
      input.privyUserId,
      REFRESH_TOKEN_TTL_SEC,
      secret,
    ),
  ]);

  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SEC };
}

async function decodeToken(
  token: string,
): Promise<GizaTokenClaims & jose.JWTPayload> {
  const secret = getSecret();
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
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
    type: 'refresh',
  };
}
