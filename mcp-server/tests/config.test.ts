import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env["GIZA_API_KEY"] = "test-api-key";
    process.env["GIZA_API_URL"] = "https://api.giza.tech";
    process.env["GIZA_PARTNER_NAME"] = "test-partner";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads valid configuration with defaults", () => {
    const config = loadConfig();
    expect(config.gizaApiKey).toBe("test-api-key");
    expect(config.gizaApiUrl).toBe("https://api.giza.tech");
    expect(config.gizaPartnerName).toBe("test-partner");
    expect(config.gizaChainId).toBe(8453);
    expect(config.transport).toBe("http");
    expect(config.port).toBe(3000);
    expect(config.rateLimitPerWallet).toBe(30);
    expect(config.rateLimitPerApp).toBe(1000);
    expect(config.rateLimitWindowMs).toBe(60_000);
    expect(config.sessionTtlMs).toBe(3_600_000);
  });

  it("throws when GIZA_API_KEY is missing", () => {
    delete process.env["GIZA_API_KEY"];
    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("throws when GIZA_PARTNER_NAME is missing", () => {
    delete process.env["GIZA_PARTNER_NAME"];
    expect(() => loadConfig()).toThrow("Invalid configuration");
  });

  it("accepts custom port from env", () => {
    process.env["PORT"] = "8080";
    const config = loadConfig();
    expect(config.port).toBe(8080);
  });

  it("accepts stdio transport", () => {
    process.env["TRANSPORT"] = "stdio";
    const config = loadConfig();
    expect(config.transport).toBe("stdio");
  });

  it("rejects invalid transport", () => {
    process.env["TRANSPORT"] = "invalid";
    expect(() => loadConfig()).toThrow();
  });

  it("accepts custom rate limit values", () => {
    process.env["RATE_LIMIT_PER_WALLET"] = "50";
    process.env["RATE_LIMIT_PER_APP"] = "2000";
    process.env["RATE_LIMIT_WINDOW_MS"] = "120000";
    const config = loadConfig();
    expect(config.rateLimitPerWallet).toBe(50);
    expect(config.rateLimitPerApp).toBe(2000);
    expect(config.rateLimitWindowMs).toBe(120_000);
  });
});
