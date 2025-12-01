/**
 * Supported blockchain networks
 */
export enum Chain {
  BASE = 8453,
  ARBITRUM = 42161,
}

/**
 * Base error class
 */
export class GizaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GizaError';
    Object.setPrototypeOf(this, GizaError.prototype);
  }
}

/**
 * Error thrown when a feature is not yet implemented
 */
export class NotImplementedError extends GizaError {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends GizaError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Ethereum address type (0x prefixed hex string)
 */
export type Address = `0x${string}`;

