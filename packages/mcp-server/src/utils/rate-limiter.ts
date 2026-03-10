export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private sweepTimer: ReturnType<typeof setInterval> | undefined;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.sweepTimer = setInterval(() => this.sweepStale(), windowMs * 2);
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }

  private sweepStale(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, timestamps] of this.windows) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, fresh);
      }
    }
  }

  check(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const timestamps = this.windows.get(key);
    if (timestamps) {
      let writeIdx = 0;
      for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i]! > cutoff) {
          timestamps[writeIdx++] = timestamps[i]!;
        }
      }
      timestamps.length = writeIdx;
      if (writeIdx >= this.maxRequests) return false;
      timestamps.push(now);
    } else {
      this.windows.set(key, [now]);
    }
    return true;
  }

  destroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = undefined;
    }
  }
}
