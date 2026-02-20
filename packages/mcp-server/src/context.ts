import type { Address } from '@gizatech/agent-sdk';
import { WalletNotConnectedError } from './errors.js';

export class WalletContextStore {
  private store = new Map<string, Address>();

  set(sessionId: string, walletAddress: Address): void {
    this.store.set(sessionId, walletAddress);
  }

  get(sessionId: string): Address | undefined {
    return this.store.get(sessionId);
  }

  requireWallet(sessionId: string): Address {
    const wallet = this.store.get(sessionId);
    if (!wallet) {
      throw new WalletNotConnectedError();
    }
    return wallet;
  }

  remove(sessionId: string): void {
    this.store.delete(sessionId);
  }

  has(sessionId: string): boolean {
    return this.store.has(sessionId);
  }
}
