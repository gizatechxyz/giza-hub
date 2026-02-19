import { describe, it, expect, afterEach } from "vitest";
import { SiweMessage } from "siwe";
import { SiweAuth } from "../src/auth/siwe.js";
import type { Config } from "../src/config.js";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    gizaApiKey: "test-key",
    gizaApiUrl: "https://api.giza.tech",
    gizaPartnerName: "test-partner",
    gizaChainId: 8453,
    siweDomain: "localhost",
    siweUri: "https://localhost",
    transport: "http",
    port: 3000,
    rateLimitPerWallet: 30,
    rateLimitPerApp: 1000,
    rateLimitWindowMs: 60_000,
    sessionTtlMs: 3_600_000,
    ...overrides,
  };
}

describe("SiweAuth", () => {
  let auth: SiweAuth;

  afterEach(() => {
    auth?.destroy();
  });

  it("generates a valid SIWE challenge", () => {
    auth = new SiweAuth(makeConfig());
    const { message, nonce } = auth.generateChallenge(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    );

    expect(nonce).toBeDefined();
    expect(nonce.length).toBeGreaterThan(0);
    expect(message).toContain("localhost");
    expect(message).toContain("Sign in to Giza Agent");
    expect(message).toContain(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    );

    // Verify it's a valid SIWE message
    const parsed = new SiweMessage(message);
    expect(parsed.nonce).toBe(nonce);
    expect(parsed.chainId).toBe(8453);
  });

  it("generates unique nonces for each challenge", () => {
    auth = new SiweAuth(makeConfig());
    const wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    const { nonce: n1 } = auth.generateChallenge(wallet);
    const { nonce: n2 } = auth.generateChallenge(wallet);
    expect(n1).not.toBe(n2);
  });

  it("rejects verification with unknown nonce", async () => {
    auth = new SiweAuth(makeConfig());

    // Generate a real challenge to get a valid message format,
    // then create a different message with a nonce not in the store
    const { message } = auth.generateChallenge(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    );

    // Parse and reconstruct with a different nonce
    const parsed = new SiweMessage(message);
    parsed.nonce = "AAAAAAAAAAAAAAAA"; // valid alphanumeric nonce, not in store
    const alteredMessage = parsed.prepareMessage();

    await expect(
      auth.verifySignature(alteredMessage, "0xfakesig"),
    ).rejects.toThrow("Invalid or expired nonce");
  });

  it("uses configured domain and URI", () => {
    auth = new SiweAuth(
      makeConfig({
        siweDomain: "myapp.com",
        siweUri: "https://myapp.com",
      }),
    );

    const { message } = auth.generateChallenge(
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    );

    const parsed = new SiweMessage(message);
    expect(parsed.domain).toBe("myapp.com");
    expect(parsed.uri).toBe("https://myapp.com");
  });
});
