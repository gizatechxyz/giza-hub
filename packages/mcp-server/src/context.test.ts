import { describe, it, expect } from 'vitest';
import { WalletContextStore } from './context.js';
import { WalletNotConnectedError } from './errors.js';
import type { Address } from '@gizatech/agent-sdk';

const WALLET: Address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

describe('WalletContextStore', () => {
  it('stores and retrieves a wallet', () => {
    const store = new WalletContextStore();
    store.set('session-1', WALLET);
    expect(store.get('session-1')).toBe(WALLET);
  });

  it('returns undefined for unknown session', () => {
    const store = new WalletContextStore();
    expect(store.get('unknown')).toBeUndefined();
  });

  it('requireWallet returns stored wallet', () => {
    const store = new WalletContextStore();
    store.set('session-1', WALLET);
    expect(store.requireWallet('session-1')).toBe(WALLET);
  });

  it('requireWallet throws WalletNotConnectedError for unknown session', () => {
    const store = new WalletContextStore();
    expect(() => store.requireWallet('unknown')).toThrow(
      WalletNotConnectedError,
    );
  });

  it('removes a session', () => {
    const store = new WalletContextStore();
    store.set('session-1', WALLET);
    store.remove('session-1');
    expect(store.has('session-1')).toBe(false);
  });

  it('has returns true for stored session', () => {
    const store = new WalletContextStore();
    store.set('session-1', WALLET);
    expect(store.has('session-1')).toBe(true);
  });

  it('has returns false for unknown session', () => {
    const store = new WalletContextStore();
    expect(store.has('unknown')).toBe(false);
  });
});
