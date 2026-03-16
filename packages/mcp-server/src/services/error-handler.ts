import {
  GizaAPIError,
  TimeoutError,
  NetworkError,
  ValidationError,
} from '@gizatech/agent-sdk';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

function errorResult(text: string): CallToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}

export function jsonResult(value: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

export async function handleToolCall<T>(
  operation: () => T | Promise<T>,
  formatResult: (result: T) => CallToolResult,
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return formatResult(result);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return errorResult(`Invalid input: ${error.message}`);
    }
    if (error instanceof GizaAPIError) {
      const detail = error.message !== error.friendlyMessage
        ? ` (${error.message})`
        : '';
      return errorResult(`${error.friendlyMessage}${detail}`);
    }
    if (error instanceof TimeoutError) {
      return errorResult(
        'This is taking longer than usual. Please try again in a moment.',
      );
    }
    if (error instanceof NetworkError) {
      return errorResult(
        "Can't connect to Giza right now. Please check your internet connection and try again.",
      );
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return errorResult('Request was cancelled. Please try again.');
    }
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResult(message);
  }
}
