import type { RateLimitEntry } from "../types.js";
import { RateLimitError } from "../errors.js";

export class RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): void {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry) {
      this.entries.set(key, { timestamps: [now] });
      return;
    }

    // Slide the window: keep only timestamps within the window
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < this.windowMs,
    );

    if (entry.timestamps.length >= this.maxRequests) {
      const oldest = entry.timestamps[0];
      const retryAfterMs = oldest
        ? this.windowMs - (now - oldest)
        : this.windowMs;
      throw new RateLimitError(Math.ceil(retryAfterMs / 1000));
    }

    entry.timestamps.push(now);
  }
}
