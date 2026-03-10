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

describe('device session', () => {
  test('createDeviceSession + completeDeviceSession stores auth', () => {
    const sessionId = `ds-store-${crypto.randomUUID()}`;
    createDeviceSession(sessionId);

    completeDeviceSession(sessionId, TEST_CTX);

    const result = getSessionAuth(sessionId);
    expect(result).toBeDefined();
    expect(result!.walletAddress).toBe(TEST_CTX.walletAddress);
    expect(result!.privyUserId).toBe(TEST_CTX.privyUserId);
  });

  test('completeDeviceSession rejects missing pending session', () => {
    expect(() =>
      completeDeviceSession('nonexistent-session', TEST_CTX),
    ).toThrow('No pending device session');
  });
});
