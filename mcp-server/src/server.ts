import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GizaAgent } from "@gizatech/agent-sdk";
import type { Config } from "./config.js";
import { SiweAuth } from "./auth/siwe.js";
import { SessionStore } from "./auth/session.js";
import { RateLimiter } from "./middleware/rate-limiter.js";
import { registerAuthTools } from "./tools/auth.tools.js";
import { registerAccountTools } from "./tools/account.tools.js";
import { registerProtocolTools } from "./tools/protocol.tools.js";
import { registerLifecycleTools } from "./tools/lifecycle.tools.js";
import { registerPortfolioTools } from "./tools/portfolio.tools.js";
import { registerFinancialTools } from "./tools/financial.tools.js";
import { registerRewardsTools } from "./tools/rewards.tools.js";

export interface ServerContext {
  mcpServer: McpServer;
  siweAuth: SiweAuth;
  sessionStore: SessionStore;
}

export function createServer(config: Config): ServerContext {
  const mcpServer = new McpServer({
    name: "giza-agent",
    version: "0.0.1",
  });

  // Initialize SDK
  process.env["GIZA_API_KEY"] = config.gizaApiKey;
  process.env["GIZA_API_URL"] = config.gizaApiUrl;
  process.env["GIZA_PARTNER_NAME"] = config.gizaPartnerName;

  const sdk = new GizaAgent({ chainId: config.gizaChainId });

  // Initialize auth
  const siweAuth = new SiweAuth(config);
  const sessionStore = new SessionStore(config.sessionTtlMs);

  // Initialize rate limiters
  const walletLimiter = new RateLimiter(
    config.rateLimitPerWallet,
    config.rateLimitWindowMs,
  );
  const appLimiter = new RateLimiter(
    config.rateLimitPerApp,
    config.rateLimitWindowMs,
  );
  const appKey = config.gizaPartnerName;

  // Register tools
  registerAuthTools(mcpServer, siweAuth, sessionStore);
  registerAccountTools(
    mcpServer,
    sdk,
    sessionStore,
    walletLimiter,
    appLimiter,
    appKey,
  );
  registerProtocolTools(
    mcpServer,
    sdk,
    sessionStore,
    walletLimiter,
    appLimiter,
    appKey,
  );
  registerLifecycleTools(
    mcpServer,
    sdk,
    sessionStore,
    walletLimiter,
    appLimiter,
    appKey,
  );
  registerPortfolioTools(
    mcpServer,
    sdk,
    sessionStore,
    walletLimiter,
    appLimiter,
    appKey,
  );
  registerFinancialTools(
    mcpServer,
    sdk,
    sessionStore,
    walletLimiter,
    appLimiter,
    appKey,
  );
  registerRewardsTools(
    mcpServer,
    sdk,
    sessionStore,
    walletLimiter,
    appLimiter,
    appKey,
  );

  return { mcpServer, siweAuth, sessionStore };
}
