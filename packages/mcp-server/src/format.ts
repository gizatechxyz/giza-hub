import type { ToolResult } from './types.js';

/**
 * Wrap a text string as a successful ToolResult.
 */
export function textResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

/**
 * Wrap a text string as an error ToolResult.
 */
export function errorResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}

/**
 * Serialize any value to a pretty-printed JSON ToolResult.
 */
export function jsonResult(data: unknown): ToolResult {
  return textResult(JSON.stringify(data, null, 2));
}

/**
 * Truncate an address to `0x1234...abcd` form.
 */
export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
