import { describe, it, expect } from "vitest";
import { RateLimiter } from "../src/middleware/rate-limiter.js";
import { RateLimitError } from "../src/errors.js";

describe("RateLimiter", () => {
  it("allows requests within the limit", () => {
    const limiter = new RateLimiter(5, 60_000);
    for (let i = 0; i < 5; i++) {
      expect(() => limiter.check("user-1")).not.toThrow();
    }
  });

  it("rejects requests over the limit", () => {
    const limiter = new RateLimiter(3, 60_000);
    limiter.check("user-1");
    limiter.check("user-1");
    limiter.check("user-1");
    expect(() => limiter.check("user-1")).toThrow(RateLimitError);
  });

  it("provides retry-after seconds on rate limit", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.check("user-1");
    try {
      limiter.check("user-1");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfterSeconds).toBeGreaterThan(0);
      expect((err as RateLimitError).retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  it("tracks different keys independently", () => {
    const limiter = new RateLimiter(2, 60_000);
    limiter.check("user-1");
    limiter.check("user-1");
    expect(() => limiter.check("user-2")).not.toThrow();
  });

  it("resets after window expires", () => {
    const limiter = new RateLimiter(1, 10);
    limiter.check("user-1");

    // Wait for window to pass
    const start = Date.now();
    while (Date.now() - start < 15) {
      // busy wait
    }

    expect(() => limiter.check("user-1")).not.toThrow();
  });
});
