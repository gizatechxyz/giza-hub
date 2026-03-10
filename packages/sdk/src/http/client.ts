import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { GizaAPIError, TimeoutError, NetworkError } from './errors';
import { ValidationError } from '../types/common';

const PROTECTED_HEADERS = new Set([
  'authorization',
  'content-type',
  'host',
]);

/**
 * Configuration for HTTP client
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  enableRetry?: boolean;
  headers?: Record<string, string>;
}

/**
 * HTTP client wrapper for API requests
 */
export class HttpClient {
  private axiosInstance: AxiosInstance;
  private enableRetry: boolean;
  private customHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.enableRetry = config.enableRetry || false;
    this.customHeaders = config.headers || {};

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 45000,
      headers: {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add custom headers to each request
        Object.entries(this.customHeaders).forEach(([key, value]) => {
          config.headers.set(key, value);
        });

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Update custom headers
   */
  public setHeaders(headers: Record<string, string>): void {
    for (const [key, value] of Object.entries(headers)) {
      if (PROTECTED_HEADERS.has(key.toLowerCase())) {
        throw new ValidationError(
          `Cannot override protected header: ${key}`,
        );
      }
      if (/[\r\n]/.test(value)) {
        throw new ValidationError(
          `Header value for "${key}" contains invalid characters`,
        );
      }
    }
    this.customHeaders = { ...this.customHeaders, ...headers };
    Object.entries(headers).forEach(([key, value]) => {
      this.axiosInstance.defaults.headers.common[key] = value;
    });
  }

  /**
   * Handle axios errors and convert to Giza errors
   */
  private handleError(error: AxiosError): Error {
    const config = error.config;
    const requestUrl = config?.url;
    const requestMethod = config?.method?.toUpperCase();

    // Timeout error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new TimeoutError(config?.timeout || 45000);
    }

    // Network error (no response from server)
    if (!error.response) {
      const message =
        error.message || 'Network error occurred. Please check your internet connection.';
      return new NetworkError(message);
    }

    // API error with response
    const statusCode = error.response.status;
    const responseData = error.response.data;

    return GizaAPIError.fromResponse(statusCode, responseData, requestUrl, requestMethod);
  }

  private async retryDelay(): Promise<void> {
    const base = 1000 + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, base));
  }

  /**
   * Make a generic request
   */
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      // If retry is enabled and error is retryable, attempt retry once
      if (this.enableRetry && this.isRetryableError(error)) {
        await this.retryDelay();
        try {
          const response = await this.axiosInstance.request<T>(config);
          return response.data;
        } catch (retryError) {
          throw retryError;
        }
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof GizaAPIError) {
      // Retry on 5xx server errors
      return error.statusCode >= 500 && error.statusCode < 600;
    }
    if (error instanceof NetworkError) {
      return true;
    }
    return false;
  }

  /**
   * Make a GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * Make a POST request
   */
  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * Make a PUT request
   */
  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * Make a PATCH request
   */
  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * Make a DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

