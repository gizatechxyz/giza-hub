import type { Response, RequestHandler } from 'express';
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { InMemoryClientsStore } from './clients-store.js';
import {
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from './session.js';
import { verifyPrivyToken } from './privy.js';
import { buildLoginPageHtml } from './authorize-page.js';
import {
  ENV_PRIVY_APP_ID,
  AUTH_CODE_TTL_MS,
  SUPPORTED_SCOPES,
} from '../constants.js';
import type { PendingAuthSession, PendingAuthCode, AuthContext } from './types.js';
import { completeDeviceSession } from './session-auth-store.js';
import { DEVICE_STATE_PREFIX } from '../constants.js';

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

export class GizaAuthProvider implements OAuthServerProvider {
  readonly clientsStore: OAuthRegisteredClientsStore =
    new InMemoryClientsStore();

  private pendingSessions = new Map<string, PendingAuthSession>();
  private codes = new Map<string, PendingAuthCode>();
  private readonly baseUrl: string;
  readonly privyAppId: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    const appId = process.env[ENV_PRIVY_APP_ID];
    if (!appId) {
      throw new Error(`${ENV_PRIVY_APP_ID} must be set`);
    }
    this.privyAppId = appId;
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.pendingSessions) {
      if (now - session.createdAt > AUTH_CODE_TTL_MS) {
        this.pendingSessions.delete(id);
      }
    }
    for (const [code, data] of this.codes) {
      if (now - data.createdAt > AUTH_CODE_TTL_MS) {
        this.codes.delete(code);
      }
    }
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    this.sweepExpired();

    const sessionId = crypto.randomUUID();

    this.pendingSessions.set(sessionId, {
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      scopes: params.scopes ?? [...SUPPORTED_SCOPES],
      createdAt: Date.now(),
    });

    const callbackUrl = `${this.baseUrl}/authorize/callback`;
    const html = buildLoginPageHtml(
      this.privyAppId,
      callbackUrl,
      sessionId,
    );
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private getValidCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): PendingAuthCode {
    const pending = this.codes.get(authorizationCode);
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
    const pending = this.getValidCode(client, authorizationCode);
    return pending.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<OAuthTokens> {
    const pending = this.getValidCode(client, authorizationCode);

    if (Date.now() - pending.createdAt > AUTH_CODE_TTL_MS) {
      this.codes.delete(authorizationCode);
      throw new Error('Authorization code expired');
    }

    this.codes.delete(authorizationCode);

    const pair = await createTokenPair({
      privyUserId: pending.privyUserId,
      walletAddress: pending.walletAddress,
      clientId: pending.clientId,
      scopes: pending.scopes,
    });

    return toOAuthTokens(pair, pending.scopes);
  }

  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
  ): Promise<OAuthTokens> {
    const claims = await verifyRefreshToken(refreshToken);
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
    });

    return toOAuthTokens(pair, effectiveScopes);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    return verifyAccessToken(token);
  }

  handlePrivyCallback(): RequestHandler {
    return async (req, res) => {
      try {
        const privyToken =
          (req.body?.privy_token as string | undefined) ??
          (req.body?.token as string | undefined);
        const stateParam = req.body?.state as string | undefined;

        if (!privyToken || !stateParam) {
          res
            .status(400)
            .json({ error: 'Missing privy_token or state parameter' });
          return;
        }

        const { privyUserId, walletAddress } =
          await verifyPrivyToken(privyToken);

        if (stateParam.startsWith(DEVICE_STATE_PREFIX)) {
          const parts = stateParam.slice(DEVICE_STATE_PREFIX.length).split(':');
          const mcpSessionId = parts[0];
          const nonce = parts[1];
          if (parts.length !== 2 || !mcpSessionId || !nonce) {
            res.status(400).json({ error: 'Invalid device state format' });
            return;
          }
          const ctx: AuthContext = {
            walletAddress,
            privyUserId,
            scopes: [...SUPPORTED_SCOPES],
            clientId: 'device',
          };
          completeDeviceSession(mcpSessionId, nonce, ctx);
          res.setHeader('Content-Type', 'text/html');
          res.send(
            '<html><body><h2>Authentication successful!</h2>' +
              '<p>You can close this tab and return to your terminal.</p>' +
              '</body></html>',
          );
          return;
        }

        const session = this.pendingSessions.get(stateParam);
        if (!session) {
          res
            .status(400)
            .json({ error: 'Invalid or expired session' });
          return;
        }

        this.pendingSessions.delete(stateParam);

        const code = crypto.randomUUID();
        this.codes.set(code, {
          clientId: session.clientId,
          redirectUri: session.redirectUri,
          codeChallenge: session.codeChallenge,
          scopes: session.scopes,
          privyUserId,
          walletAddress,
          createdAt: Date.now(),
        });

        const redirectUrl = new URL(session.redirectUri);
        redirectUrl.searchParams.set('code', code);
        if (session.state) {
          redirectUrl.searchParams.set('state', session.state);
        }

        res.redirect(redirectUrl.toString());
      } catch (error) {
        console.error('Privy callback error:', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    };
  }
}
