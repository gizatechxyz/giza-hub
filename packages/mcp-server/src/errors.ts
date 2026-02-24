import {
  GizaError,
  ValidationError,
  GizaAPIError,
  TimeoutError,
  NetworkError,
} from '@gizatech/agent-sdk';
import type { ToolResult } from './types.js';

/**
 * Thrown when a tool requires a connected wallet but none is set.
 */
export class WalletNotConnectedError extends GizaError {
  constructor() {
    super(
      'No wallet connected. Use connect_wallet first ' +
        'to set your wallet address for this session.',
    );
    this.name = 'WalletNotConnectedError';
    Object.setPrototypeOf(this, WalletNotConnectedError.prototype);
  }
}

/**
 * Convert any error into an LLM-friendly ToolResult.
 *
 * Maps SDK error types to actionable messages so the LLM
 * can communicate failures clearly to the user.
 */
export function formatToolError(error: unknown): ToolResult {
  if (error instanceof WalletNotConnectedError) {
    return {
      content: [{ type: 'text', text: error.message }],
      isError: true,
    };
  }

  if (error instanceof GizaAPIError) {
    return {
      content: [{ type: 'text', text: error.friendlyMessage }],
      isError: true,
    };
  }

  if (error instanceof ValidationError) {
    return {
      content: [{ type: 'text', text: `Validation error: ${error.message}` }],
      isError: true,
    };
  }

  if (error instanceof TimeoutError) {
    return {
      content: [
        { type: 'text', text: 'Request timed out. Please try again.' },
      ],
      isError: true,
    };
  }

  if (error instanceof NetworkError) {
    return {
      content: [
        { type: 'text', text: 'Network error. Please check connectivity and try again.' },
      ],
      isError: true,
    };
  }

  if (error instanceof GizaError) {
    return {
      content: [{ type: 'text', text: error.message }],
      isError: true,
    };
  }

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
