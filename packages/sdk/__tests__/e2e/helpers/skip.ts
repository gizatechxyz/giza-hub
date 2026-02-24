import { E2EState, getState } from './state';

/**
 * Returns a test function (`it` or `it.skip`) based on whether
 * the required state keys are present. Use at describe-level:
 *
 *   const testIf = ifState('walletAddress');
 *   testIf('does something', async () => { ... });
 */
export function ifState(
  ...keys: (keyof E2EState)[]
): typeof it {
  const state = getState();
  const missing = keys.find(
    (k) => state[k] === undefined || state[k] === null,
  );

  if (missing) {
    return it.skip;
  }
  return it;
}
