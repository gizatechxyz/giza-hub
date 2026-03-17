import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { randomUUID } from 'node:crypto';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import {
  SERVER_NAME,
  SERVER_VERSION,
  GIZA_INSTRUCTIONS,
  ENV_REDIS_URL,
  getBaseUrl,
} from '../../../src/constants';
import { registerAllTools } from '../../../src/server';
import { verifyAccessToken } from '../../../src/auth/session';
import { securityLogger } from '../../../src/utils/security-logger';

const handler = createMcpHandler(
  registerAllTools,
  {
    serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    capabilities: { logging: {} },
    instructions: GIZA_INSTRUCTIONS,
  },
  {
    basePath: '/api',
    redisUrl: process.env[ENV_REDIS_URL],
    // @ts-expect-error — mcp-handler@1.0.7 types restrict sessionIdGenerator
    // to `undefined`, but the runtime accepts a generator; required by
    // @modelcontextprotocol/sdk ≥1.26 which disallows stateless transport reuse.
    sessionIdGenerator: randomUUID,
  },
);

async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  try {
    return await verifyAccessToken(bearerToken);
  } catch (error) {
    securityLogger.authFailure({
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

const wrappedHandler = withMcpAuth(handler, verifyToken, {
  required: false,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
  resourceUrl: getBaseUrl(),
});

async function authHandler(req: Request): Promise<Response> {
  try {
    return await wrappedHandler(req);
  } catch (error) {
    console.error('[MCP Route Error]', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

function optionsHandler(): Response {
  return new Response(null, { status: 204 });
}

export {
  authHandler as GET,
  authHandler as POST,
  authHandler as DELETE,
  optionsHandler as OPTIONS,
};
