import { describe, it, expect, afterEach } from "vitest";
import { SessionStore } from "../src/auth/session.js";
import { RateLimiter } from "../src/middleware/rate-limiter.js";
import { requireAuth, checkRateLimit } from "../src/middleware/auth-guard.js";
import { AuthRequiredError, RateLimitError } from "../src/errors.js";

describe("requireAuth", () => {
  let store: SessionStore;

  afterEach(() => {
    store?.destroy();
  });

  it("returns session when authenticated", () => {
    store = new SessionStore(60_000);
    store.set("session-1", {
      walletAddress: "0xabc",
      chainId: 8453,
      createdAt: Date.now(),
    });

    const session = requireAuth(store, "session-1");
    expect(session.walletAddress).toBe("0xabc");
  });

  it("throws AuthRequiredError when not authenticated", () => {
    store = new SessionStore(60_000);
    expect(() => requireAuth(store, "non-existent")).toThrow(
      AuthRequiredError,
    );
  });
});

describe("checkRateLimit", () => {
  it("passes when within both limits", () => {
    const walletLimiter = new RateLimiter(10, 60_000);
    const appLimiter = new RateLimiter(100, 60_000);
    expect(() =>
      checkRateLimit(walletLimiter, appLimiter, "0xabc", "test-app"),
    ).not.toThrow();
  });

  it("throws when wallet limit exceeded", () => {
    const walletLimiter = new RateLimiter(1, 60_000);
    const appLimiter = new RateLimiter(100, 60_000);
    checkRateLimit(walletLimiter, appLimiter, "0xabc", "test-app");
    expect(() =>
      checkRateLimit(walletLimiter, appLimiter, "0xabc", "test-app"),
    ).toThrow(RateLimitError);
  });

  it("throws when app limit exceeded", () => {
    const walletLimiter = new RateLimiter(100, 60_000);
    const appLimiter = new RateLimiter(1, 60_000);
    checkRateLimit(walletLimiter, appLimiter, "0xabc", "test-app");
    expect(() =>
      checkRateLimit(walletLimiter, appLimiter, "0xabc", "test-app"),
    ).toThrow(RateLimitError);
  });
});
