import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSystemTools } from './tools/system';
import { registerDiscoveryTools } from './tools/discovery';
import { registerProtectedTools } from './tools/protected';
import { registerAgentManagementTools } from './tools/agent-management';
import { registerLifecycleTools } from './tools/lifecycle';
import { registerMonitoringTools } from './tools/monitoring';
import { registerTransactionTools } from './tools/transactions';
import { registerRewardTools } from './tools/rewards';
import { registerProtocolTools } from './tools/protocols';
import { registerOptimizerTools } from './tools/optimizer';
import { registerFinancialTools } from './tools/financial';
import { registerCriticalTools } from './tools/critical';

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
