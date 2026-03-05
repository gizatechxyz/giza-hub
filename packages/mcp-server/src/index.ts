import { randomUUID } from 'node:crypto';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { createMcpServer } from './server.js';
import {
  DEFAULT_PORT,
  ENV_PORT,
  ENV_MCP_DOMAIN,
  ENV_PRIVY_APP_ID,
  SUPPORTED_SCOPES,
} from './constants.js';
import { GizaAuthProvider } from './auth/provider.js';
import { optionalBearerAuth } from './auth/middleware.js';
import { buildPrivyLoginUrl } from './auth/authorize-page.js';
import { clearSessionAuth } from './auth/session-auth-store.js';

const transports: Record<string, StreamableHTTPServerTransport> = {};

function createApp(port: number): express.Express {
  const app = express();
  app.use(express.json());

  const issuerBase =
    process.env[ENV_MCP_DOMAIN] ?? `http://127.0.0.1:${port}`;
  const issuerUrl = new URL(issuerBase);

  const provider = new GizaAuthProvider(issuerBase);

  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      scopesSupported: [...SUPPORTED_SCOPES],
      resourceServerUrl: new URL(`${issuerBase}/mcp`),
    }),
  );

  app.get('/authorize/callback', provider.handlePrivyCallback());

  app.get('/login', (req, res) => {
    const mcpSessionId = req.query['session'] as string | undefined;
    if (!mcpSessionId) {
      res.status(400).json({ error: 'Missing session parameter' });
      return;
    }
    const callbackUrl = `${issuerBase}/authorize/callback`;
    const loginUrl = buildPrivyLoginUrl(
      process.env[ENV_PRIVY_APP_ID]!,
      callbackUrl,
      `device:${mcpSessionId}`,
    );
    res.redirect(loginUrl);
  });

  const resourceMetadataUrl =
    `${issuerBase}/.well-known/oauth-protected-resource`;
  const authMiddleware = optionalBearerAuth(provider, resourceMetadataUrl);

  app.post('/mcp', authMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && transports[sessionId]) {
      await transports[sessionId].handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          clearSessionAuth(transport.sessionId);
        }
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res
      .status(400)
      .json({ error: 'Invalid request: missing or invalid session' });
  });

  app.get('/mcp', authMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete('/mcp', authMiddleware, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (sessionId && transports[sessionId]) {
      await transports[sessionId].handleRequest(req, res);
    } else {
      res.status(400).json({ error: 'Invalid or missing session ID' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

export { createApp };

if (import.meta.main) {
  const port = Number(process.env[ENV_PORT]) || DEFAULT_PORT;
  const app = createApp(port);
  app.listen(port, '127.0.0.1', () => {
    console.log(`Giza MCP server listening on http://127.0.0.1:${port}/mcp`);
  });
}
