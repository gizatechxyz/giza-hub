import { SiweMessage, generateNonce } from "siwe";
import { type Chain as ViemChain, createPublicClient, http } from "viem";
import { base, arbitrum } from "viem/chains";
import type { PendingChallenge } from "../types.js";
import type { Config } from "../config.js";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const CHAIN_MAP: Record<number, ViemChain> = {
  8453: base,
  42161: arbitrum,
};

export class SiweAuth {
  private readonly pendingChallenges = new Map<string, PendingChallenge>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    this.cleanupTimer = setInterval(
      () => this.cleanupExpired(),
      CLEANUP_INTERVAL_MS,
    );
  }

  generateChallenge(walletAddress: string): {
    message: string;
    nonce: string;
  } {
    const nonce = generateNonce();
    const now = new Date();

    const siweMessage = new SiweMessage({
      domain: this.config.siweDomain,
      address: walletAddress,
      statement: "Sign in to Giza Agent",
      uri: this.config.siweUri ?? `https://${this.config.siweDomain}`,
      version: "1",
      chainId: this.config.gizaChainId,
      nonce,
      issuedAt: now.toISOString(),
      expirationTime: new Date(
        now.getTime() + CHALLENGE_TTL_MS,
      ).toISOString(),
    });

    const message = siweMessage.prepareMessage();

    this.pendingChallenges.set(nonce, {
      walletAddress: walletAddress.toLowerCase(),
      message,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });

    return { message, nonce };
  }

  async verifySignature(
    message: string,
    signature: string,
  ): Promise<{ walletAddress: string; chainId: number }> {
    const siweMessage = new SiweMessage(message);

    const pending = this.pendingChallenges.get(siweMessage.nonce);
    if (!pending) {
      throw new Error(
        "Invalid or expired nonce. Generate a new challenge.",
      );
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingChallenges.delete(siweMessage.nonce);
      throw new Error("Challenge expired. Generate a new challenge.");
    }

    if (
      pending.walletAddress !==
      siweMessage.address.toLowerCase()
    ) {
      throw new Error(
        "Wallet address mismatch between challenge and message.",
      );
    }

    // Consume the nonce to prevent replay
    this.pendingChallenges.delete(siweMessage.nonce);

    const chain = CHAIN_MAP[siweMessage.chainId ?? this.config.gizaChainId];

    if (this.config.rpcUrl && chain) {
      // Use viem for on-chain verification (supports ERC-1271 smart wallets)
      const client = createPublicClient({
        chain,
        transport: http(this.config.rpcUrl),
      });

      const valid = await client.verifyMessage({
        address: siweMessage.address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!valid) {
        throw new Error("Signature verification failed.");
      }
    } else {
      // Fallback: use siwe library (EOA only, no ERC-1271)
      const result = await siweMessage.verify({
        signature,
      });

      if (!result.success) {
        const errMsg = result.error?.type ?? "unknown";
        throw new Error(`Signature verification failed: ${errMsg}`);
      }
    }

    return {
      walletAddress: siweMessage.address.toLowerCase(),
      chainId: siweMessage.chainId ?? this.config.gizaChainId,
    };
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.pendingChallenges.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [nonce, challenge] of this.pendingChallenges) {
      if (now > challenge.expiresAt) {
        this.pendingChallenges.delete(nonce);
      }
    }
  }
}
