import type { Session } from "../types.js";

const CLEANUP_INTERVAL_MS = 60 * 1000;

export class SessionStore {
  private readonly sessions = new Map<string, Session>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;
  private readonly ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
    this.cleanupTimer = setInterval(
      () => this.cleanupExpired(),
      CLEANUP_INTERVAL_MS,
    );
  }

  set(sessionId: string, session: Session): void {
    this.sessions.set(sessionId, session);
  }

  get(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (Date.now() - session.createdAt > this.ttlMs) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.sessions.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }
}
