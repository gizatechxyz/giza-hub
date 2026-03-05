import type { RequestHandler } from 'express';
import type { OAuthTokenVerifier } from '@modelcontextprotocol/sdk/server/auth/provider.js';
// Augments express.Request with `auth?: AuthInfo`
import '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';

const BEARER_RE = /^Bearer\s+(.+)$/i;

export function optionalBearerAuth(
  verifier: OAuthTokenVerifier,
  resourceMetadataUrl: string,
): RequestHandler {
  const wwwAuthenticate =
    `Bearer resource_metadata="${resourceMetadataUrl}"`;

  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      req.auth = undefined;
      next();
      return;
    }

    const match = BEARER_RE.exec(header);
    if (!match?.[1]) {
      res
        .status(401)
        .set('WWW-Authenticate', wwwAuthenticate)
        .json({ error: 'Malformed Authorization header' });
      return;
    }

    try {
      req.auth = await verifier.verifyAccessToken(match[1]);
      next();
    } catch {
      res
        .status(401)
        .set('WWW-Authenticate', wwwAuthenticate)
        .json({ error: 'Invalid or expired access token' });
    }
  };
}
