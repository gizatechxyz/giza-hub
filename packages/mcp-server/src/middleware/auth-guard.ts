import type { SessionStore } from "../auth/session.js";
import type { RateLimiter } from "./rate-limiter.js";
import type { Session } from "../types.js";
import { AuthRequiredError } from "../errors.js";

export function requireAuth(
  sessionStore: SessionStore,
  sessionId: string,
): Session {
  const session = sessionStore.get(sessionId);
  if (!session) {
    throw new AuthRequiredError();
  }
  return session;
}

export function checkRateLimit(
  walletLimiter: RateLimiter,
  appLimiter: RateLimiter,
  walletAddress: string,
  appKey: string,
): void {
  // Check app-level first for fast fail
  appLimiter.check(appKey);
  walletLimiter.check(walletAddress);
}
