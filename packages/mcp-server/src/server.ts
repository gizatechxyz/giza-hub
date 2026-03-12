import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSystemTools } from './tools/system.js';
import { registerDiscoveryTools } from './tools/discovery.js';
import { registerProtectedTools } from './tools/protected.js';
import { registerAgentManagementTools } from './tools/agent-management.js';
import { registerLifecycleTools } from './tools/lifecycle.js';
import { registerMonitoringTools } from './tools/monitoring.js';
import { registerTransactionTools } from './tools/transactions.js';
import { registerRewardTools } from './tools/rewards.js';
import { registerProtocolTools } from './tools/protocols.js';
import { registerOptimizerTools } from './tools/optimizer.js';
import { registerFinancialTools } from './tools/financial.js';
import { registerCriticalTools } from './tools/critical.js';

export function registerAllTools(server: McpServer): void {
  registerSystemTools(server);
  registerDiscoveryTools(server);
  registerProtectedTools(server);
  registerAgentManagementTools(server);
  registerLifecycleTools(server);
  registerMonitoringTools(server);
  registerTransactionTools(server);
  registerRewardTools(server);
  registerProtocolTools(server);
  registerOptimizerTools(server);
  registerFinancialTools(server);
  registerCriticalTools(server);
}
