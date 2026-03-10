import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import compression from 'compression';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { createMcpServer } from './server.js';
import {
  DEFAULT_PORT,
  ENV_PORT,
  ENV_MCP_DOMAIN,
  SUPPORTED_SCOPES,
  DEVICE_STATE_PREFIX,
  MAX_MCP_TRANSPORTS,
} from './constants.js';
import { GizaAuthProvider } from './auth/provider.js';
import { optionalBearerAuth } from './auth/middleware.js';
import { buildLoginPageHtml } from './auth/authorize-page.js';
import {
  clearSessionAuth,
  createDeviceSession,
} from './auth/session-auth-store.js';
import { SlidingWindowRateLimiter } from './utils/rate-limiter.js';
import { securityLogger } from './utils/security-logger.js';

const transports: Record<string, StreamableHTTPServerTransport> = {};
let transportCount = 0;

const authRateLimiter = new SlidingWindowRateLimiter(60_000, 20);
const mcpRateLimiter = new SlidingWindowRateLimiter(60_000, 100);

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.ip ?? 'unknown';
}

function rateLimit(
  limiter: SlidingWindowRateLimiter,
  route: string,
): express.RequestHandler {
  return (req, res, next) => {
    const ip = getClientIp(req);
    if (!limiter.check(ip)) {
      securityLogger.rateLimited({ route, ip });
      res.status(429).setHeader('Retry-After', '60').json({ error: 'Too many requests' });
      return;
    }
    next();
  };
}

function createApp(port: number): express.Express {
  const app = express();
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));

  const issuerBase =
    process.env[ENV_MCP_DOMAIN] ?? `http://127.0.0.1:${port}`;
  const issuerUrl = new URL(issuerBase);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    next();
  });

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', issuerBase);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  const provider = new GizaAuthProvider(issuerBase);

  const publicDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../dist/public',
  );
  app.use('/public', express.static(publicDir));

  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      scopesSupported: [...SUPPORTED_SCOPES],
      resourceServerUrl: new URL(`${issuerBase}/mcp`),
    }),
  );

  app.post(
    '/authorize/callback',
    express.urlencoded({ extended: false, limit: '10kb' }),
    rateLimit(authRateLimiter, '/authorize/callback'),
    provider.handlePrivyCallback(),
  );

  app.get('/login', rateLimit(authRateLimiter, '/login'), (req, res) => {
    const mcpSessionId = req.query['session'] as string | undefined;
    if (!mcpSessionId) {
      res.status(400).json({ error: 'Missing session parameter' });
      return;
    }
    createDeviceSession(mcpSessionId);
    const callbackUrl = `${issuerBase}/authorize/callback`;
    const html = buildLoginPageHtml(
      provider.privyAppId,
      callbackUrl,
      `${DEVICE_STATE_PREFIX}${mcpSessionId}`,
    );
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  const resourceMetadataUrl =
    `${issuerBase}/.well-known/oauth-protected-resource`;
  const authMiddleware = optionalBearerAuth(provider, resourceMetadataUrl);

  app.post('/mcp', authMiddleware, rateLimit(mcpRateLimiter, '/mcp'), async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && transports[sessionId]) {
      await transports[sessionId].handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      if (transportCount >= MAX_MCP_TRANSPORTS) {
        res.status(503).json({ error: 'Server at capacity. Try again later.' });
        return;
      }
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
          transportCount++;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          transportCount--;
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
