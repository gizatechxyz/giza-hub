import { Chain, ValidationError } from './types/common';
import { ADDRESS_REGEX, TX_HASH_REGEX } from './constants';

export function validateAddress(
  address: string,
  fieldName: string,
): void {
  if (!address) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (!ADDRESS_REGEX.test(address)) {
    throw new ValidationError(
      `${fieldName} must be a valid Ethereum address ` +
        '(0x followed by 40 hex characters)',
    );
  }
}

export function validateChainId(chainId: Chain): void {
  const validChains = Object.values(Chain).filter(
    (v) => typeof v === 'number',
  ) as number[];

  if (!validChains.includes(chainId)) {
    throw new ValidationError(
      `chainId must be one of: ${validChains.join(', ')}. ` +
        `Got: ${chainId}`,
    );
  }
}

export function validatePositiveIntString(
  value: string,
  fieldName: string,
): void {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }
  try {
    const num = BigInt(value);
    if (num <= 0n) {
      throw new ValidationError(
        `${fieldName} must be a positive integer`,
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError(
      `${fieldName} must be a valid positive integer string, ` +
        `got: ${value}`,
    );
  }
}

export function validateNonNegativeIntString(
  value: string,
  fieldName: string,
): void {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is required`);
  }
  try {
    const num = BigInt(value);
    if (num < 0n) {
      throw new ValidationError(
        `${fieldName} must be non-negative`,
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError(
      `${fieldName} must be a valid non-negative integer string, ` +
        `got: ${value}`,
    );
  }
}

export function validateTxHash(
  hash: string,
  fieldName: string,
): void {
  if (!hash) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (!TX_HASH_REGEX.test(hash)) {
    throw new ValidationError(
      `${fieldName} must be a valid transaction hash ` +
        '(0x followed by 64 hex characters)',
    );
  }
}

export function validatePathSegment(
  value: string,
  fieldName: string,
): void {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new ValidationError(
      `${fieldName} contains invalid characters`,
    );
  }
}
