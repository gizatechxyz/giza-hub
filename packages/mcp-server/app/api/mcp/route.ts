import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import {
  SERVER_NAME,
  SERVER_VERSION,
  GIZA_INSTRUCTIONS,
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
    basePath: '/api/mcp',
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

const authHandler = withMcpAuth(handler, verifyToken, {
  required: false,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
