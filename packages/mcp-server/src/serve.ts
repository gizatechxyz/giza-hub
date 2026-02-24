import type { ServerConfig } from './types.js';
import { resolveConfig } from './config.js';
import { createGizaServer } from './server.js';

/**
 * One-call convenience: resolve config, create server, connect transport.
 *
 * @example
 * ```typescript
 * import { serve } from '@gizatech/mcp-server';
 * serve(); // reads from env vars, starts stdio
 * ```
 *
 * @example
 * ```typescript
 * serve({ chain: 8453, transport: 'http', port: 3001 });
 * ```
 */
export async function serve(config?: ServerConfig): Promise<void> {
  const resolved = resolveConfig(config);
  const server = createGizaServer(resolved);

  if (resolved.transport === 'http') {
    await server.http({ port: resolved.port });
  } else {
    await server.stdio();
  }
}
