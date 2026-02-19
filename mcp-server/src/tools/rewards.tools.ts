import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GizaAgent } from "@gizatech/agent-sdk";
import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../middleware/auth-guard.js";
import { formatToolError } from "../errors.js";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function registerRewardsTools(
  server: McpServer,
  sdk: GizaAgent,
  sessionStore: SessionStore,
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  appKey: string,
): void {
  server.tool(
    "get_fees",
    "Get fee information for a Giza agent, including the fee percentage and absolute fee amount.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
    },
    async ({ smart_account_address }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.getFees(
          smart_account_address as `0x${string}`,
        );

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    "claim_rewards",
    "Claim accrued rewards for a Giza agent. Returns details of all claimed reward tokens and amounts.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
    },
    async ({ smart_account_address }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.claimRewards(
          smart_account_address as `0x${string}`,
        );

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
