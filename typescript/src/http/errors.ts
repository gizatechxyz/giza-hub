import { GizaError } from '../types/common';

/**
 * API error response structure
 */
interface APIErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Error thrown when an API request fails
 */
export class GizaAPIError extends GizaError {
  /**
   * HTTP status code from the response
   */
  public readonly statusCode: number;

  /**
   * Raw response data from the API
   */
  public readonly responseData: unknown;

  /**
   * Request URL that failed
   */
  public readonly requestUrl?: string;

  /**
   * Request method that failed
   */
  public readonly requestMethod?: string;

  constructor(
    message: string,
    statusCode: number,
    responseData?: unknown,
    requestUrl?: string,
    requestMethod?: string
  ) {
    super(message);
    this.name = 'GizaAPIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
    this.requestUrl = requestUrl;
    this.requestMethod = requestMethod;
    Object.setPrototypeOf(this, GizaAPIError.prototype);
  }

  /**
   * Parse error from API response
   */
  static fromResponse(
    statusCode: number,
    responseData: unknown,
    requestUrl?: string,
    requestMethod?: string
  ): GizaAPIError {
    let message = 'API request failed';

    if (responseData && typeof responseData === 'object') {
      const errorData = responseData as APIErrorResponse;
      message = errorData.message || errorData.detail || errorData.error || message;
    } else if (typeof responseData === 'string') {
      message = responseData;
    }

    // Add status code context to message
    if (statusCode === 400) {
      message = `Bad Request: ${message}`;
    } else if (statusCode === 401) {
      message = `Unauthorized: ${message}`;
    } else if (statusCode === 403) {
      message = `Forbidden: ${message}`;
    } else if (statusCode === 404) {
      message = `Not Found: ${message}`;
    } else if (statusCode >= 500) {
      message = `Server Error: ${message}`;
    }

    return new GizaAPIError(message, statusCode, responseData, requestUrl, requestMethod);
  }

  /**
   * Human-readable error message
   */
  get friendlyMessage(): string {
    switch (this.statusCode) {
      case 400:
        return 'Invalid request. Please check your parameters.';
      case 401:
        return 'Authentication failed. Please check your API key.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found. Please check the address or parameters.';
      case 429:
        return 'Too many requests. Please wait and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.';
      default:
        return this.message;
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      requestUrl: this.requestUrl,
      requestMethod: this.requestMethod,
      responseData: this.responseData,
    };
  }
}

/**
 * Error thrown when network request times out
 */
export class TimeoutError extends GizaError {
  constructor(timeout: number, message?: string) {
    super(message || `Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when network connection fails
 */
export class NetworkError extends GizaError {
  constructor(message: string) {
    super(`Network error: ${message}`);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

