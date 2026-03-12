import { describe, test, expect } from 'bun:test';

import { verifyPrivyToken } from '../../../auth/privy';

describe('verifyPrivyToken', () => {
  test('returns privyUserId and walletAddress for valid token', async () => {
    const result = await verifyPrivyToken('valid-privy-token');

    expect(result).toHaveProperty('privyUserId');
    expect(result).toHaveProperty('walletAddress');
    expect(typeof result.privyUserId).toBe('string');
    expect(typeof result.walletAddress).toBe('string');
    expect(result.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
