import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function errorResult(text: string): CallToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

export function formatToolError(error: unknown): CallToolResult {
  if (error instanceof AuthRequiredError) {
    return errorResult(
      "Authentication required. Please authenticate first by " +
        "calling generate_siwe_challenge and then verify_siwe_signature.",
    );
  }

  if (error instanceof RateLimitError) {
    return errorResult(
      `Rate limit exceeded. Try again in ${error.retryAfterSeconds} seconds.`,
    );
  }

  if (isGizaAPIError(error)) {
    return errorResult(error.friendlyMessage ?? error.message);
  }

  if (isValidationError(error)) {
    return errorResult(`Validation error: ${error.message}`);
  }

  if (isTimeoutError(error)) {
    return errorResult(
      "Request timed out. The Giza backend may be under load — try again.",
    );
  }

  if (isNetworkError(error)) {
    return errorResult(
      "Network error reaching Giza backend. Check connectivity and try again.",
    );
  }

  if (error instanceof Error) {
    return errorResult(`Error: ${error.message}`);
  }

  return errorResult("An unexpected error occurred.");
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Rate limit exceeded, retry after ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}

function isGizaAPIError(
  err: unknown,
): err is Error & { friendlyMessage?: string; statusCode: number } {
  return (
    err instanceof Error &&
    err.name === "GizaAPIError" &&
    "statusCode" in err
  );
}

function isValidationError(err: unknown): err is Error {
  return err instanceof Error && err.name === "ValidationError";
}

function isTimeoutError(err: unknown): err is Error {
  return err instanceof Error && err.name === "TimeoutError";
}

function isNetworkError(err: unknown): err is Error {
  return err instanceof Error && err.name === "NetworkError";
}
