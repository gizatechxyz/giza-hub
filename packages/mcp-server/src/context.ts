import type { Address } from '@gizatech/agent-sdk';
import { WalletNotConnectedError } from './errors.js';

/**
 * Per-session wallet context store.
 *
 * LLMs work better with a "connect wallet, then operate" flow.
 * This store maps session IDs to wallet addresses so tools can
 * resolve the wallet without the user re-supplying it each call.
 */
export class WalletContextStore {
  private readonly sessions = new Map<string, Address>();

  set(sessionId: string, wallet: Address): void {
    this.sessions.set(sessionId, wallet);
  }

  get(sessionId: string): Address | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get the wallet for a session, throwing if not connected.
   */
  require(sessionId: string): Address {
    const wallet = this.sessions.get(sessionId);
    if (!wallet) {
      throw new WalletNotConnectedError();
    }
    return wallet;
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
