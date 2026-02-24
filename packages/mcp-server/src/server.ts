import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { Giza } from '@gizatech/agent-sdk';
import { WalletContextStore } from './context.js';
import { formatToolError } from './errors.js';
import type {
  ToolDefinition,
  ToolContext,
  ResolvedServerConfig,
} from './types.js';

const DEFAULT_SESSION = 'default';

/**
 * Wraps McpServer with Giza-specific tool registration and transports.
 */
export class GizaServer {
  public readonly mcp: McpServer;
  private readonly giza: Giza;
  private readonly walletStore: WalletContextStore;

  constructor(config: ResolvedServerConfig) {
    this.giza = config.giza;
    this.walletStore = new WalletContextStore();

    this.mcp = new McpServer({
      name: config.name,
      version: config.version,
    });

    this.registerTools(config.tools);
    this.registerPrompt(config.systemPrompt);
  }

  /**
   * Connect via stdio transport (Claude Desktop, Cursor, etc.).
   */
  async stdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcp.connect(transport);
  }

  /**
   * Start an HTTP server with StreamableHTTP transport.
   */
  async http(options: { port?: number } = {}): Promise<void> {
    const port = options.port ?? 3000;
    const { StreamableHTTPServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/streamableHttp.js'
    );
    const http = await import('node:http');

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    await this.mcp.connect(transport);

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      if (url.pathname === '/mcp') {
        await transport.handleRequest(req, res);
      } else if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.error(`Giza MCP server listening on http://localhost:${port}/mcp`);
    });
  }

  private registerTools(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      const inputShape = tool.inputSchema.shape as Record<
        string,
        z.ZodTypeAny
      >;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MCP SDK's tool() overloads cause deep type instantiation with dynamic schemas
      (this.mcp.tool as any)(
        tool.name,
        tool.description,
        inputShape,
        async (input: Record<string, unknown>) => {
          const ctx: ToolContext = {
            giza: this.giza,
            walletStore: this.walletStore,
            sessionId: DEFAULT_SESSION,
          };
          try {
            return await tool.handler(ctx, input);
          } catch (error: unknown) {
            return formatToolError(error);
          }
        },
      );
    }
  }

  private registerPrompt(systemPrompt: string): void {
    this.mcp.prompt(
      'system',
      'Giza yield optimization assistant system prompt',
      () => ({
        messages: [
          {
            role: 'assistant' as const,
            content: {
              type: 'text' as const,
              text: systemPrompt,
            },
          },
        ],
      }),
    );
  }
}

/**
 * Create a GizaServer from a resolved config.
 */
export function createGizaServer(
  config: ResolvedServerConfig,
): GizaServer {
  return new GizaServer(config);
}
