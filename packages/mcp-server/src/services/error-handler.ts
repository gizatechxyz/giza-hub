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
  operation: () => Promise<T>,
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
      return errorResult(error.friendlyMessage);
    }
    if (error instanceof TimeoutError) {
      return errorResult(
        'Request timed out. The Giza API may be experiencing high load. Please try again.',
      );
    }
    if (error instanceof NetworkError) {
      return errorResult(
        'Unable to reach the Giza API. Please check your network connection and try again.',
      );
    }
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResult(message);
  }
}
