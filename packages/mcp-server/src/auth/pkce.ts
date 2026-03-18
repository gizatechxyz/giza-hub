import { createHash, timingSafeEqual } from 'node:crypto';

export function verifyS256Challenge(
  verifier: string,
  challenge: string,
): boolean {
  const expected = createHash('sha256').update(verifier).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(challenge);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
