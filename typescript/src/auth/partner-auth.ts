import { ValidationError } from '../types/common';

/**
 * Partner authentication handler
 * Manages API key for partner-level authentication
 */
export class PartnerAuth {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.validateApiKey(apiKey);
    this.apiKey = apiKey;
  }

  /**
   * Validate API key format and presence
   */
  private validateApiKey(apiKey: string): void {
    if (!apiKey) {
      throw new ValidationError('Partner API key is required');
    }

    if (typeof apiKey !== 'string') {
      throw new ValidationError('Partner API key must be a string');
    }

    if (apiKey.trim().length === 0) {
      throw new ValidationError('Partner API key cannot be empty');
    }
  }

  /**
   * Get authentication headers for API requests
   * Returns headers object with X-Partner-API-Key
   */
  public getHeaders(): Record<string, string> {
    return {
      'X-Partner-API-Key': this.apiKey,
    };
  }

  /**
   * Get the raw API key
   */
  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Check if API key is set
   */
  public hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

