import { describe, it, expect, afterEach, vi } from "vitest";
import { SessionStore } from "../src/auth/session.js";

describe("SessionStore", () => {
  let store: SessionStore;

  afterEach(() => {
    store?.destroy();
  });

  it("stores and retrieves a session", () => {
    store = new SessionStore(60_000);
    store.set("session-1", {
      walletAddress: "0xabc",
      chainId: 8453,
      createdAt: Date.now(),
    });

    const session = store.get("session-1");
    expect(session).toBeDefined();
    expect(session!.walletAddress).toBe("0xabc");
    expect(session!.chainId).toBe(8453);
  });

  it("returns undefined for non-existent session", () => {
    store = new SessionStore(60_000);
    expect(store.get("non-existent")).toBeUndefined();
  });

  it("expires sessions after TTL", () => {
    store = new SessionStore(100);
    store.set("session-1", {
      walletAddress: "0xabc",
      chainId: 8453,
      createdAt: Date.now() - 200,
    });

    expect(store.get("session-1")).toBeUndefined();
  });

  it("deletes a session", () => {
    store = new SessionStore(60_000);
    store.set("session-1", {
      walletAddress: "0xabc",
      chainId: 8453,
      createdAt: Date.now(),
    });

    store.delete("session-1");
    expect(store.get("session-1")).toBeUndefined();
  });

  it("cleans up expired sessions periodically", () => {
    vi.useFakeTimers();
    store = new SessionStore(1000);
    store.set("session-1", {
      walletAddress: "0xabc",
      chainId: 8453,
      createdAt: Date.now() - 2000,
    });

    // Advance past cleanup interval
    vi.advanceTimersByTime(61_000);

    // Session should be cleaned up
    expect(store.get("session-1")).toBeUndefined();
    vi.useRealTimers();
  });
});
