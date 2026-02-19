import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SiweAuth } from "../auth/siwe.js";
import type { SessionStore } from "../auth/session.js";
import { formatToolError } from "../errors.js";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function registerAuthTools(
  server: McpServer,
  siweAuth: SiweAuth,
  sessionStore: SessionStore,
): void {
  server.tool(
    "generate_siwe_challenge",
    "Generate a Sign-In with Ethereum (SIWE) challenge message for wallet authentication. The user must sign this message with their wallet to prove ownership.",
    { wallet_address: z.string().regex(ADDRESS_REGEX, "Invalid Ethereum address") },
    async ({ wallet_address }) => {
      try {
        const { message, nonce } = siweAuth.generateChallenge(wallet_address);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ message, nonce }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.tool(
    "verify_siwe_signature",
    "Verify a signed SIWE message to authenticate the user's wallet. On success, creates an authenticated session for subsequent tool calls.",
    {
      message: z.string().min(1, "SIWE message is required"),
      signature: z.string().min(1, "Signature is required"),
    },
    async ({ message, signature }, extra) => {
      try {
        const { walletAddress, chainId } =
          await siweAuth.verifySignature(message, signature);

        const sessionId = extra.sessionId ?? "stdio";
        sessionStore.set(sessionId, {
          walletAddress,
          chainId,
          createdAt: Date.now(),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  authenticated: true,
                  wallet_address: walletAddress,
                  chain_id: chainId,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
