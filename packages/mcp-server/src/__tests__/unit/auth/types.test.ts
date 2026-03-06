import { describe, test, expect } from 'bun:test';

import {
  parseWalletAddress,
  extractAuthContext,
} from '../../../auth/types.js';
import {
  buildAuthInfo,
  TEST_WALLET,
  TEST_PRIVY_USER,
  TEST_CLIENT_ID,
  TEST_SCOPES,
} from '../../helpers/mock-auth.js';

describe('parseWalletAddress', () => {
  test('returns the address when valid', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    expect(parseWalletAddress(addr)).toBe(addr);
  });

  test('accepts uppercase hex characters', () => {
    const addr = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    expect(parseWalletAddress(addr)).toBe(addr);
  });

  test('throws on missing 0x prefix', () => {
    expect(() =>
      parseWalletAddress('1234567890abcdef1234567890abcdef12345678'),
    ).toThrow('Invalid wallet address format');
  });

  test('throws on address too short', () => {
    expect(() => parseWalletAddress('0x1234')).toThrow(
      'Invalid wallet address format',
    );
  });

  test('throws on address too long', () => {
    expect(() =>
      parseWalletAddress(
        '0x1234567890abcdef1234567890abcdef1234567800',
      ),
    ).toThrow('Invalid wallet address format');
  });

  test('throws on non-hex characters', () => {
    expect(() =>
      parseWalletAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'),
    ).toThrow('Invalid wallet address format');
  });

  test('throws on empty string', () => {
    expect(() => parseWalletAddress('')).toThrow(
      'Invalid wallet address format',
    );
  });
});

describe('extractAuthContext', () => {
  test('returns AuthContext for valid AuthInfo', () => {
    const authInfo = buildAuthInfo();
    const ctx = extractAuthContext(authInfo);

    expect(ctx).toBeDefined();
    expect(ctx!.walletAddress).toBe(TEST_WALLET);
    expect(ctx!.privyUserId).toBe(TEST_PRIVY_USER);
    expect(ctx!.scopes).toEqual(TEST_SCOPES);
    expect(ctx!.clientId).toBe(TEST_CLIENT_ID);
  });

  test('returns undefined when authInfo is undefined', () => {
    expect(extractAuthContext(undefined)).toBeUndefined();
  });

  test('returns undefined when extra is missing', () => {
    const authInfo = buildAuthInfo();
    authInfo.extra = undefined;
    expect(extractAuthContext(authInfo)).toBeUndefined();
  });

  test('returns undefined when wallet is missing from extra', () => {
    const authInfo = buildAuthInfo();
    authInfo.extra = { privyUserId: TEST_PRIVY_USER };
    expect(extractAuthContext(authInfo)).toBeUndefined();
  });

  test('returns undefined when privyUserId is missing from extra', () => {
    const authInfo = buildAuthInfo();
    authInfo.extra = { wallet: TEST_WALLET };
    expect(extractAuthContext(authInfo)).toBeUndefined();
  });

  test('returns undefined when wallet is not a string', () => {
    const authInfo = buildAuthInfo();
    authInfo.extra = { wallet: 12345, privyUserId: TEST_PRIVY_USER };
    expect(extractAuthContext(authInfo)).toBeUndefined();
  });

  test('returns undefined when privyUserId is not a string', () => {
    const authInfo = buildAuthInfo();
    authInfo.extra = { wallet: TEST_WALLET, privyUserId: 99 };
    expect(extractAuthContext(authInfo)).toBeUndefined();
  });
});

