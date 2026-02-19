import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GizaAgent } from "@gizatech/agent-sdk";
import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "../middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../middleware/auth-guard.js";
import { formatToolError } from "../errors.js";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function registerLifecycleTools(
  server: McpServer,
  sdk: GizaAgent,
  sessionStore: SessionStore,
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  appKey: string,
): void {
  server.tool(
    "activate_agent",
    "Activate a Giza agent for a smart account after the user has deposited funds. The agent will start optimizing yield across the selected protocols.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      initial_token: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid token address"),
      selected_protocols: z
        .array(z.string().min(1))
        .min(1, "At least one protocol is required"),
      tx_hash: z.string().optional(),
    },
    async (
      { smart_account_address, initial_token, selected_protocols, tx_hash },
      extra,
    ) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.activate({
          wallet: smart_account_address as `0x${string}`,
          origin_wallet: session.walletAddress as `0x${string}`,
          initial_token: initial_token as `0x${string}`,
          selected_protocols,
          tx_hash,
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
    "deactivate_agent",
    "Deactivate a Giza agent. Optionally transfers remaining balance back to the origin wallet.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      transfer: z.boolean().optional(),
    },
    async ({ smart_account_address, transfer }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.deactivate({
          wallet: smart_account_address as `0x${string}`,
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
    "top_up",
    "Add more funds to an active Giza agent. Provide the transaction hash of the deposit.",
    {
      smart_account_address: z
        .string()
        .regex(ADDRESS_REGEX, "Invalid smart account address"),
      tx_hash: z.string().min(1, "Transaction hash is required"),
    },
    async ({ smart_account_address, tx_hash }, extra) => {
      try {
        const sessionId = extra.sessionId ?? "stdio";
        const session = requireAuth(sessionStore, sessionId);
        checkRateLimit(
          walletLimiter,
          appLimiter,
          session.walletAddress,
          appKey,
        );

        const result = await sdk.agent.topUp({
          wallet: smart_account_address as `0x${string}`,
          tx_hash,
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
    "run_agent",
    "Manually trigger a Giza agent run for a smart account. The agent will evaluate current positions and rebalance if needed.",
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

        const result = await sdk.agent.run({
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
}
