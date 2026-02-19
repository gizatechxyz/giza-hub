import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GizaAgent } from "@gizatech/agent-sdk";
import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../middleware/auth-guard.js";
import { formatToolError } from "../errors.js";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function registerProtocolTools(
  server: McpServer,
  sdk: GizaAgent,
  sessionStore: SessionStore,
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  appKey: string,
): void {
  server.tool(
    "get_protocols",
    "Get available DeFi protocols for a given token. Returns the list of protocols that Giza agents can use for yield optimization with the specified token.",
    {
      token_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid token address"),
    },
    async ({ token_address }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.getProtocols(
          token_address as `0x${string}`,
        );

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
