import { Address } from '../../src/types/common';
import { SmartAccountInfo } from '../../src/types/agent';

export function assertValidAddress(address: unknown): asserts address is Address {
  expect(typeof address).toBe('string');
  expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
}

export function assertSmartAccountInfo(
  info: unknown
): asserts info is SmartAccountInfo {
  expect(info).toBeDefined();
  expect(typeof info).toBe('object');

  const account = info as SmartAccountInfo;

  assertValidAddress(account.smartAccountAddress);
  assertValidAddress(account.backendWallet);
  assertValidAddress(account.origin_wallet);

  expect(typeof account.chain).toBe('number');
  expect([8453, 42161]).toContain(account.chain);
}

export function assertErrorMessage(error: unknown, expectedMessage: string | RegExp): void {
  expect(error).toBeInstanceOf(Error);
  const err = error as Error;

  if (typeof expectedMessage === 'string') {
    expect(err.message).toContain(expectedMessage);
  } else {
    expect(err.message).toMatch(expectedMessage);
  }
}

export function assertErrorType<T extends Error>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T
): asserts error is T {
  expect(error).toBeInstanceOf(ErrorClass);
}
