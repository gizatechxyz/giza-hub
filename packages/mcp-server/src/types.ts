import type { z } from 'zod';
import type { Giza, Address } from '@gizatech/agent-sdk';
import type { WalletContextStore } from './context.js';

/**
 * Context passed to every tool handler at invocation time.
 */
export interface ToolContext {
  giza: Giza;
  walletStore: WalletContextStore;
  sessionId: string;
}

/**
 * Standardized MCP tool response.
 * Index signature required for MCP SDK compatibility.
 */
export interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Portable tool definition -- a plain object that can be composed,
 * filtered, and registered on any McpServer.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (
    ctx: ToolContext,
    input: Record<string, unknown>,
  ) => Promise<ToolResult>;
}

/**
 * Configuration accepted by `serve()` and `createGizaServer()`.
 */
export interface ServerConfig {
  /** Pre-built Giza SDK instance (tier 3). */
  giza?: Giza;
  /** Chain ID -- falls back to CHAIN_ID env var. */
  chain?: number;
  /** API key -- falls back to GIZA_API_KEY env var. */
  apiKey?: string;
  /** Partner name -- falls back to GIZA_PARTNER_NAME env var. */
  partner?: string;
  /** API base URL -- falls back to GIZA_API_URL env var. */
  apiUrl?: string;
  /** Tool definitions to register. Defaults to allTools. */
  tools?: ToolDefinition[];
  /** Custom system prompt registered as an MCP prompt. */
  systemPrompt?: string;
  /** MCP server name. */
  name?: string;
  /** MCP server version. */
  version?: string;
  /** Transport type. */
  transport?: 'stdio' | 'http';
  /** HTTP port (default: 3000). */
  port?: number;
}

/**
 * Resolved configuration with all required values present.
 */
export interface ResolvedServerConfig {
  giza: Giza;
  tools: ToolDefinition[];
  systemPrompt: string;
  name: string;
  version: string;
  transport: 'stdio' | 'http';
  port: number;
}

/**
 * Wallet address branded type re-exported for convenience.
 */
export type { Address };
