import { ValidationError } from '../types/common';

/**
 * Partner authentication handler
 * Manages API key and partner name for partner-level authentication
 */
export class PartnerAuth {
  private readonly apiKey: string;
  private readonly partnerName: string;

  constructor(apiKey: string, partnerName: string) {
    this.validateApiKey(apiKey);
    this.validatePartnerName(partnerName);
    this.apiKey = apiKey;
    this.partnerName = partnerName;
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
   * Validate partner name format and presence
   */
  private validatePartnerName(partnerName: string): void {
    if (!partnerName) {
      throw new ValidationError('Partner name is required');
    }

    if (typeof partnerName !== 'string') {
      throw new ValidationError('Partner name must be a string');
    }

    if (partnerName.trim().length === 0) {
      throw new ValidationError('Partner name cannot be empty');
    }
  }

  /**
   * Get authentication headers for API requests
   * Returns headers object with X-Partner-API-Key and X-Partner-Name
   */
  public getHeaders(): Record<string, string> {
    return {
      'X-Partner-API-Key': this.apiKey,
      'X-Partner-Name': this.partnerName,
    };
  }

  /**
   * Get the raw API key
   */
  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the partner name
   */
  public getPartnerName(): string {
    return this.partnerName;
  }

  /**
   * Check if API key is set
   */
  public hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

