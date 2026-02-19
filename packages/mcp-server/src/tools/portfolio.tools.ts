import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GizaAgent } from "@gizatech/agent-sdk";
import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../middleware/auth-guard.js";
import { formatToolError } from "../errors.js";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function registerPortfolioTools(
  server: McpServer,
  sdk: GizaAgent,
  sessionStore: SessionStore,
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  appKey: string,
): void {
  server.tool(
    "get_portfolio",
    "Get portfolio information for a Giza agent, including deposits, withdrawals, current status, and selected protocols.",
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

        const result = await sdk.agent.getPortfolio({
          wallet: smart_account_address as `0x${string}`,
        });

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
    "get_performance",
    "Get historical performance data for a Giza agent, showing value changes over time.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      from_date: z
        .string()
        .optional()
        .describe("Start date (ISO format or YYYY-MM-DD HH:MM:SS)"),
    },
    async ({ smart_account_address, from_date }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.getPerformance({
          wallet: smart_account_address as `0x${string}`,
          from_date,
        });

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
    "get_apr",
    "Get the Annual Percentage Rate (APR) for a Giza agent, with optional date range filtering.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      start_date: z
        .string()
        .optional()
        .describe("Start date for APR calculation (ISO datetime)"),
      end_date: z
        .string()
        .optional()
        .describe("End date for APR calculation (ISO datetime)"),
    },
    async ({ smart_account_address, start_date, end_date }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.getAPR({
          wallet: smart_account_address as `0x${string}`,
          start_date,
          end_date,
        });

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
