import { createHash, timingSafeEqual } from 'node:crypto';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { RedisClientsStore } from './redis-clients-store';
import {
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  checkRevocation,
} from './session';
import { verifyPrivyToken } from './privy';
import {
  buildLoginPageHtml,
  buildLoginCsp,
  buildSuccessPageHtml,
  buildSuccessCsp,
} from './authorize-page';
import {
  ENV_PRIVY_APP_ID,
  AUTH_CODE_TTL_MS,
  SUPPORTED_SCOPES,
  MAX_PENDING_SESSIONS,
  MAX_AUTH_CODES,
} from '../constants';
import { RedisAuthStore } from '../utils/redis-auth-store';
import type { PendingAuthSession, PendingAuthCode } from './types';
import { securityLogger } from '../utils/security-logger';

export interface AuthorizeResult {
  html: string;
  headers: Record<string, string>;
}

export type CallbackResult =
  | { type: 'html'; html: string; headers: Record<string, string> }
  | { type: 'error'; status: number; body: { error: string } };

function toOAuthTokens(
  pair: { accessToken: string; refreshToken: string; expiresIn: number },
  scopes: string[],
): OAuthTokens {
  return {
    access_token: pair.accessToken,
    token_type: 'Bearer',
    expires_in: pair.expiresIn,
    refresh_token: pair.refreshToken,
    scope: scopes.join(' '),
  };
}

export interface AuthorizationParams {
  state?: string;
  scopes?: string[];
  codeChallenge: string;
  redirectUri: string;
}

export class GizaAuthProvider {
  readonly clientsStore: OAuthRegisteredClientsStore =
    new RedisClientsStore();

  private pendingSessions = new RedisAuthStore<PendingAuthSession>(
    'giza:pending:',
    Math.floor(AUTH_CODE_TTL_MS / 1000),
    MAX_PENDING_SESSIONS,
  );
  private codes = new RedisAuthStore<PendingAuthCode>(
    'giza:code:',
    Math.floor(AUTH_CODE_TTL_MS / 1000),
    MAX_AUTH_CODES,
  );
  private readonly baseUrl: string;
  readonly privyAppId: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    const appId = process.env[ENV_PRIVY_APP_ID];
    if (!appId) {
      throw new Error('Privy app ID not configured. Check environment configuration.');
    }
    this.privyAppId = appId;
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
  ): Promise<AuthorizeResult> {
    const sessionId = crypto.randomUUID();

    await this.pendingSessions.set(sessionId, {
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      scopes: params.scopes ?? [...SUPPORTED_SCOPES],
      createdAt: Date.now(),
    });

    const nonce = crypto.randomUUID();
    const callbackUrl = `${this.baseUrl}/api/authorize/callback`;
    const html = buildLoginPageHtml(
      this.privyAppId,
      callbackUrl,
      sessionId,
      nonce,
    );

    return {
      html,
      headers: {
        'Content-Type': 'text/html',
        'Content-Security-Policy': buildLoginCsp(nonce),
      },
    };
  }

  private async getValidCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<PendingAuthCode> {
    const pending = await this.codes.get(authorizationCode);
    if (!pending) {
      throw new Error('Invalid authorization code');
    }
    if (client.client_id !== pending.clientId) {
      throw new Error('Authorization code was not issued to this client');
    }
    return pending;
  }

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const pending = await this.getValidCode(client, authorizationCode);
    return pending.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    const pending = await this.getValidCode(client, authorizationCode);
    return this.exchangeValidCode(pending, authorizationCode, redirectUri);
  }

  async verifyPkceAndExchange(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    codeVerifier: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    const pending = await this.getValidCode(client, authorizationCode);

    const expected = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const a = Buffer.from(expected);
    const b = Buffer.from(pending.codeChallenge);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('PKCE verification failed');
    }

    return this.exchangeValidCode(pending, authorizationCode, redirectUri);
  }

  private async exchangeValidCode(
    pending: PendingAuthCode,
    authorizationCode: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    if (redirectUri && redirectUri !== pending.redirectUri) {
      throw new Error('Redirect URI mismatch');
    }

    if (Date.now() - pending.createdAt > AUTH_CODE_TTL_MS) {
      await this.codes.delete(authorizationCode);
      throw new Error('Authorization code expired');
    }

    await this.codes.delete(authorizationCode);

    const pair = await createTokenPair({
      privyUserId: pending.privyUserId,
      walletAddress: pending.walletAddress,
      clientId: pending.clientId,
      scopes: pending.scopes,
      privyIdToken: pending.privyIdToken,
    });

    return toOAuthTokens(pair, pending.scopes);
  }

  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
  ): Promise<OAuthTokens> {
    const claims = await verifyRefreshToken(refreshToken);
    await checkRevocation(claims.sub, claims.iat);
    if (scopes) {
      const allowed = new Set(claims.scopes);
      const invalid = scopes.filter((s) => !allowed.has(s));
      if (invalid.length > 0) {
        throw new Error('Requested scopes exceed original grant');
      }
    }
    const effectiveScopes = scopes ?? claims.scopes;

    const pair = await createTokenPair({
      privyUserId: claims.sub,
      walletAddress: claims.wallet,
      clientId: claims.clientId,
      scopes: effectiveScopes,
      privyIdToken: claims.privyIdToken,
    });

    return toOAuthTokens(pair, effectiveScopes);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    return verifyAccessToken(token);
  }

  async handlePrivyCallback(input: {
    privyIdToken?: string;
    state?: string;
  }): Promise<CallbackResult> {
    try {
      const { privyIdToken, state: stateParam } = input;

      if (!privyIdToken || !stateParam) {
        return {
          type: 'error',
          status: 400,
          body: { error: 'Missing identity token or state parameter' },
        };
      }

      const { privyUserId, walletAddress } =
        await verifyPrivyToken(privyIdToken);

      const session = await this.pendingSessions.get(stateParam);
      if (!session) {
        return {
          type: 'error',
          status: 400,
          body: { error: 'Invalid or expired session' },
        };
      }

      const client = await this.clientsStore.getClient(session.clientId);
      if (!client) {
        await this.pendingSessions.delete(stateParam);
        return {
          type: 'error',
          status: 400,
          body: { error: 'Unknown client' },
        };
      }
      if (!client.redirect_uris.includes(session.redirectUri)) {
        await this.pendingSessions.delete(stateParam);
        return {
          type: 'error',
          status: 400,
          body: { error: 'Redirect URI not registered for client' },
        };
      }

      await this.pendingSessions.delete(stateParam);

      const code = crypto.randomUUID();
      await this.codes.set(code, {
        clientId: session.clientId,
        redirectUri: session.redirectUri,
        codeChallenge: session.codeChallenge,
        scopes: session.scopes,
        privyUserId,
        walletAddress,
        privyIdToken,
        createdAt: Date.now(),
      });

      const redirectUrl = new URL(session.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (session.state) {
        redirectUrl.searchParams.set('state', session.state);
      }

      securityLogger.authSuccess({
        flow: 'oauth',
        clientId: session.clientId,
      });
      return {
        type: 'html',
        html: buildSuccessPageHtml(redirectUrl.toString()),
        headers: {
          'Content-Type': 'text/html',
          'Content-Security-Policy': buildSuccessCsp(redirectUrl.toString()),
        },
      };
    } catch (error) {
      securityLogger.authFailure({
        reason:
          error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        type: 'error',
        status: 500,
        body: { error: 'Authentication failed' },
      };
    }
  }
}
