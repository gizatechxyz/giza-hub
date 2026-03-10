import { describe, test, expect, afterEach } from 'bun:test';
import { SlidingWindowRateLimiter } from '../../../utils/rate-limiter.js';

const originalDateNow = Date.now;
afterEach(() => {
  Date.now = originalDateNow;
});

describe('SlidingWindowRateLimiter', () => {
  test('allows requests within limit', () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 3);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    limiter.destroy();
  });

  test('blocks excess requests', () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 2);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);
    limiter.destroy();
  });

  test('tracks keys independently', () => {
    const limiter = new SlidingWindowRateLimiter(60_000, 1);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip2')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);
    limiter.destroy();
  });

  test('resets after window expires', () => {
    const now = originalDateNow();
    Date.now = () => now;
    const limiter = new SlidingWindowRateLimiter(1000, 1);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);
    Date.now = () => now + 1001;
    expect(limiter.check('ip1')).toBe(true);
    limiter.destroy();
  });
});
