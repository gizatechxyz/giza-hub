import { randomUUID } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './config.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.transport === 'http') {
    await startHttpServer(config);
  } else {
    await startStdioServer(config);
  }
}

async function startStdioServer(
  config: ReturnType<typeof loadConfig>,
): Promise<void> {
  const { server } = createServer(config, 'stdio');
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttpServer(
  config: ReturnType<typeof loadConfig>,
): Promise<void> {
  const sessions = new Map<
    string,
    {
      transport: StreamableHTTPServerTransport;
      walletStore: ReturnType<typeof createServer>['walletStore'];
    }
  >();

  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${config.port}`);

    if (url.pathname !== '/mcp') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const existingSessionId = req.headers['mcp-session-id'] as
      | string
      | undefined;

    if (req.method === 'DELETE') {
      if (existingSessionId && sessions.has(existingSessionId)) {
        const session = sessions.get(existingSessionId)!;
        session.walletStore.remove(existingSessionId);
        await session.transport.handleRequest(req, res);
        sessions.delete(existingSessionId);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
      }
      return;
    }

    if (req.method === 'GET' || req.method === 'POST') {
      if (existingSessionId && sessions.has(existingSessionId)) {
        const session = sessions.get(existingSessionId)!;
        if (req.method === 'POST') {
          const body = await readBody(req);
          await session.transport.handleRequest(req, res, body);
        } else {
          await session.transport.handleRequest(req, res);
        }
        return;
      }

      // New session
      const newSessionId = randomUUID();
      const { server, walletStore } = createServer(config, newSessionId);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
      });

      transport.onclose = () => {
        walletStore.remove(newSessionId);
        sessions.delete(newSessionId);
      };

      sessions.set(newSessionId, { transport, walletStore });
      await server.connect(transport);

      if (req.method === 'POST') {
        const body = await readBody(req);
        await transport.handleRequest(req, res, body);
      } else {
        await transport.handleRequest(req, res);
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  });

  httpServer.listen(config.port, () => {
    const msg = `Giza MCP server listening on http://localhost:${config.port}/mcp`;
    process.stderr.write(`${msg}\n`);
  });
}

function readBody(
  req: import('node:http').IncomingMessage,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Fatal: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
