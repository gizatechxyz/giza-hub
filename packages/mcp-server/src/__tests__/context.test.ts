import { WalletContextStore } from '../context.js';
import { WalletNotConnectedError } from '../errors.js';
import type { Address } from '@gizatech/agent-sdk';

describe('WalletContextStore', () => {
  let store: WalletContextStore;
  const wallet = '0x1234567890abcdef1234567890abcdef12345678' as Address;

  beforeEach(() => {
    store = new WalletContextStore();
  });

  it('stores and retrieves a wallet', () => {
    store.set('s1', wallet);
    expect(store.get('s1')).toBe(wallet);
  });

  it('returns undefined for unknown session', () => {
    expect(store.get('unknown')).toBeUndefined();
  });

  it('require() returns wallet when set', () => {
    store.set('s1', wallet);
    expect(store.require('s1')).toBe(wallet);
  });

  it('require() throws WalletNotConnectedError when not set', () => {
    expect(() => store.require('unknown')).toThrow(WalletNotConnectedError);
  });

  it('delete() removes the wallet', () => {
    store.set('s1', wallet);
    expect(store.delete('s1')).toBe(true);
    expect(store.get('s1')).toBeUndefined();
  });

  it('delete() returns false for unknown session', () => {
    expect(store.delete('unknown')).toBe(false);
  });

  it('has() reports presence correctly', () => {
    expect(store.has('s1')).toBe(false);
    store.set('s1', wallet);
    expect(store.has('s1')).toBe(true);
  });
});
