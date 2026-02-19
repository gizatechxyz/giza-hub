import { AxiosError } from 'axios';

export function createMockAxiosError(
  statusCode: number,
  message: string,
  url?: string,
  method?: string
): AxiosError {
  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.config = {
    url,
    method,
    timeout: 45000,
    headers: {} as any,
  } as any;
  error.response = {
    status: statusCode,
    statusText: getStatusText(statusCode),
    data: { message },
    headers: {},
    config: error.config!,
  } as any;
  error.name = 'AxiosError';
  return error;
}

export function createMockNetworkError(message = 'Network Error'): AxiosError {
  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.config = {
    timeout: 45000,
    headers: {} as any,
  } as any;
  error.name = 'AxiosError';
  error.code = 'ECONNREFUSED';
  // No response property for network errors
  return error;
}

export function createMockTimeoutError(): AxiosError {
  const error = new Error('timeout of 45000ms exceeded') as AxiosError;
  error.isAxiosError = true;
  error.config = {
    timeout: 45000,
    headers: {} as any,
  } as any;
  error.name = 'AxiosError';
  error.code = 'ECONNABORTED';
  // No response property for timeout errors
  return error;
}

function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return statusTexts[statusCode] || 'Unknown';
}

export const API_ERROR_RESPONSES = {
  UNAUTHORIZED: {
    message: 'Invalid API key',
    statusCode: 401,
  },
  NOT_FOUND: {
    message: 'Smart account not found',
    statusCode: 404,
  },
  BAD_REQUEST: {
    message: 'Invalid request parameters',
    statusCode: 400,
  },
  SERVER_ERROR: {
    message: 'Internal server error',
    statusCode: 500,
  },
  RATE_LIMIT: {
    message: 'Too many requests',
    statusCode: 429,
  },
  // Performance-specific errors
  WALLET_NOT_FOUND: {
    message: 'Data not found for the wallet',
    statusCode: 404,
  },
  INVALID_DATE_FORMAT: {
    message: 'Invalid date format',
    statusCode: 400,
  },
  INSUFFICIENT_APR_DATA: {
    message: 'Not enough historical data for APR calculation',
    statusCode: 400,
  },
  WALLET_DEACTIVATED: {
    message: 'Wallet status is deactivated',
    statusCode: 400,
  },
} as const;

