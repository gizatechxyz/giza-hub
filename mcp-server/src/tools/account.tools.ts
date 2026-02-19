import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GizaAgent } from "@gizatech/agent-sdk";
import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../middleware/auth-guard.js";
import { formatToolError } from "../errors.js";

export function registerAccountTools(
  server: McpServer,
  sdk: GizaAgent,
  sessionStore: SessionStore,
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  appKey: string,
): void {
  server.tool(
    "create_smart_account",
    "Create a new Giza smart account for the authenticated wallet. The smart account is used to deposit funds and interact with DeFi protocols through Giza agents.",
    {},
    async (_params, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.createSmartAccount({
          origin_wallet: session.walletAddress as `0x${string}`,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    "get_smart_account",
    "Get the Giza smart account associated with the authenticated wallet. Returns the smart account address and configuration.",
    {},
    async (_params, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.getSmartAccount({
          origin_wallet: session.walletAddress as `0x${string}`,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
