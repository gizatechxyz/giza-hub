import {
  GizaAPIError,
  TimeoutError,
  NetworkError,
  ValidationError,
} from '@gizatech/agent-sdk';

export class WalletNotConnectedError extends Error {
  constructor() {
    super('No wallet connected');
    this.name = 'WalletNotConnectedError';
  }
}

interface ToolErrorResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

export function formatToolError(error: unknown): ToolErrorResponse {
  if (error instanceof WalletNotConnectedError) {
    return errorResponse(
      'No wallet connected. Please use connect_wallet first.',
    );
  }

  if (error instanceof GizaAPIError) {
    return formatApiError(error);
  }

  if (error instanceof TimeoutError) {
    return errorResponse(
      'Request timed out. Please try again in a moment.',
    );
  }

  if (error instanceof NetworkError) {
    return errorResponse(
      'Could not reach the Giza service. Check connectivity and try again.',
    );
  }

  if (error instanceof ValidationError) {
    return errorResponse(error.message);
  }

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return errorResponse(message);
}

function formatApiError(error: GizaAPIError): ToolErrorResponse {
  switch (error.statusCode) {
    case 400:
      return errorResponse(
        extractApiMessage(error) ??
          'Invalid request. Please check the parameters and try again.',
      );
    case 401:
      return errorResponse(
        'Authentication failed. The API key may be misconfigured — contact the app admin.',
      );
    case 404:
      return errorResponse(
        'Not found. No smart account exists for this wallet — would you like to create one?',
      );
    default:
      return errorResponse(
        error.friendlyMessage ?? 'Something went wrong. Please try again.',
      );
  }
}

function extractApiMessage(error: GizaAPIError): string | null {
  if (
    error.responseData &&
    typeof error.responseData === 'object' &&
    'message' in error.responseData &&
    typeof (error.responseData as Record<string, unknown>).message === 'string'
  ) {
    return (error.responseData as Record<string, string>).message;
  }
  return null;
}

function errorResponse(text: string): ToolErrorResponse {
  return {
    content: [{ type: 'text', text }],
    isError: true,
  };
}
