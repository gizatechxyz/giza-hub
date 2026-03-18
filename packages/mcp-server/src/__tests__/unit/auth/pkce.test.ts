import { describe, test, expect } from 'bun:test';
import { createHash } from 'node:crypto';
import { verifyS256Challenge } from '../../../auth/pkce';

function makeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

describe('verifyS256Challenge', () => {
  test('returns true for matching verifier and challenge', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = makeChallenge(verifier);
    expect(verifyS256Challenge(verifier, challenge)).toBe(true);
  });

  test('returns false for wrong verifier', () => {
    const challenge = makeChallenge('correct-verifier');
    expect(verifyS256Challenge('wrong-verifier', challenge)).toBe(false);
  });

  test('returns false for empty strings', () => {
    expect(verifyS256Challenge('', '')).toBe(false);
  });

  test('returns false for empty verifier with real challenge', () => {
    const challenge = makeChallenge('real-verifier');
    expect(verifyS256Challenge('', challenge)).toBe(false);
  });
});
