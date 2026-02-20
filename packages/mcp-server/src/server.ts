import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GizaAgent } from '@gizatech/agent-sdk';
import type { Config } from './config.js';
import { WalletContextStore } from './context.js';
import { registerWalletTools } from './tools/wallet.tools.js';
import { registerAccountTools } from './tools/account.tools.js';
import { registerProtocolTools } from './tools/protocol.tools.js';
import { registerLifecycleTools } from './tools/lifecycle.tools.js';
import { registerPortfolioTools } from './tools/portfolio.tools.js';
import { registerFinancialTools } from './tools/financial.tools.js';
import { registerRewardsTools } from './tools/rewards.tools.js';
import { registerSystemPrompt } from './prompts/system.js';

export interface ServerInstance {
  server: McpServer;
  walletStore: WalletContextStore;
}

export function createServer(
  config: Config,
  sessionId: string,
): ServerInstance {
  // Set env vars the SDK reads directly
  process.env.GIZA_API_KEY = config.gizaApiKey;
  process.env.GIZA_PARTNER_NAME = config.gizaPartnerName;
  process.env.GIZA_API_URL = config.gizaApiUrl;

  const sdk = new GizaAgent({ chainId: config.gizaChainId });

  const server = new McpServer({
    name: 'giza-yield-server',
    version: '0.1.0',
  });

  const walletStore = new WalletContextStore();

  registerWalletTools(server, sdk, walletStore, sessionId);
  registerAccountTools(server, sdk, walletStore, sessionId);
  registerProtocolTools(server, sdk);
  registerLifecycleTools(server, sdk, walletStore, sessionId);
  registerPortfolioTools(server, sdk);
  registerFinancialTools(server, sdk, walletStore, sessionId);
  registerRewardsTools(server, sdk);
  registerSystemPrompt(server);

  return { server, walletStore };
}
