import type { RequestHandler } from 'express';
import type { OAuthTokenVerifier } from '@modelcontextprotocol/sdk/server/auth/provider.js';
// Augments express.Request with `auth?: AuthInfo`
import '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';

export function optionalBearerAuth(
  verifier: OAuthTokenVerifier,
): RequestHandler {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      next();
      return;
    }

    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match?.[1]) {
      res.status(401).json({ error: 'Malformed Authorization header' });
      return;
    }

    try {
      req.auth = await verifier.verifyAccessToken(match[1]);
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired access token' });
    }
  };
}
