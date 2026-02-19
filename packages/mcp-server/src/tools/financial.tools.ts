import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type GizaAgent, SortOrder } from "@gizatech/agent-sdk";
import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../middleware/auth-guard.js";
import { formatToolError } from "../errors.js";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function registerFinancialTools(
  server: McpServer,
  sdk: GizaAgent,
  sessionStore: SessionStore,
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  appKey: string,
): void {
  server.tool(
    "withdraw",
    "Withdraw funds from a Giza agent. Partial withdrawal (specify amount) keeps the agent active. Full withdrawal (omit amount) deactivates the agent.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      amount: z
        .string()
        .optional()
        .describe(
          "Amount to withdraw in smallest token unit. Omit for full withdrawal.",
        ),
      transfer: z
        .boolean()
        .optional()
        .describe(
          "Transfer to origin wallet (default: true). Only for full withdrawal.",
        ),
    },
    async ({ smart_account_address, amount, transfer }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.withdraw({
          wallet: smart_account_address as `0x${string}`,
          amount,
          transfer,
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
    "get_withdrawal_status",
    "Check the current withdrawal/deactivation status of a Giza agent.",
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

        const result = await sdk.agent.getWithdrawalStatus(
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
    "get_transactions",
    "Get transaction history for a Giza agent with pagination support.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      page: z.number().int().positive().optional().describe("Page number"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Items per page (max 100)"),
      sort: z
        .enum(["date_asc", "date_desc"])
        .optional()
        .describe("Sort order"),
    },
    async ({ smart_account_address, page, limit, sort }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.getTransactions({
          wallet: smart_account_address as `0x${string}`,
          page,
          limit,
          sort: sort as SortOrder | undefined,
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
    "get_deposits",
    "Get deposit history for a Giza agent.",
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

        const result = await sdk.agent.getDeposits(
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
