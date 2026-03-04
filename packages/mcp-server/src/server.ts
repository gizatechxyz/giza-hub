import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { registerSystemTools } from './tools/system.js';
import { registerDiscoveryTools } from './tools/discovery.js';
import { registerProtectedTools } from './tools/protected.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerSystemTools(server);
  registerDiscoveryTools(server);
  registerProtectedTools(server);

  return server;
}
