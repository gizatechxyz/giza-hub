import { describe, test, expect } from 'bun:test';
import {
  createDeviceSession,
  completeDeviceSession,
  getSessionAuth,
} from '../../../auth/session-auth-store.js';
import type { AuthContext } from '../../../auth/types.js';

const TEST_CTX: AuthContext = {
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  privyUserId: 'privy-user-123',
  scopes: ['mcp:tools'],
  clientId: 'device',
};

describe('device session nonce', () => {
  test('createDeviceSession + completeDeviceSession stores auth', () => {
    const sessionId = `ds-store-${crypto.randomUUID()}`;
    const nonce = createDeviceSession(sessionId);

    completeDeviceSession(sessionId, nonce, TEST_CTX);

    const result = getSessionAuth(sessionId);
    expect(result).toBeDefined();
    expect(result!.walletAddress).toBe(TEST_CTX.walletAddress);
    expect(result!.privyUserId).toBe(TEST_CTX.privyUserId);
  });

  test('completeDeviceSession rejects wrong nonce', () => {
    const sessionId = `ds-wrong-${crypto.randomUUID()}`;
    createDeviceSession(sessionId);

    expect(() =>
      completeDeviceSession(sessionId, 'wrong-nonce', TEST_CTX),
    ).toThrow('Device session nonce mismatch');
  });

  test('completeDeviceSession rejects missing pending session', () => {
    expect(() =>
      completeDeviceSession('nonexistent-session', 'any-nonce', TEST_CTX),
    ).toThrow('No pending device session');
  });
});
