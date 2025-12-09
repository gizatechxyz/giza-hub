import { PartnerAuth } from '../../../src/auth/partner-auth';
import { ValidationError } from '../../../src/types/common';

describe('PartnerAuth', () => {
  const validApiKey = 'valid-api-key';
  const validPartnerName = 'test-partner';

  describe('constructor', () => {
    it('should create instance with valid API key and partner name', () => {
      const auth = new PartnerAuth(validApiKey, validPartnerName);
      expect(auth).toBeInstanceOf(PartnerAuth);
    });

    it('should throw ValidationError for empty string API key', () => {
      expect(() => new PartnerAuth('', validPartnerName)).toThrow(ValidationError);
      expect(() => new PartnerAuth('', validPartnerName)).toThrow('Partner API key is required');
    });

    it('should throw ValidationError for whitespace-only API key', () => {
      expect(() => new PartnerAuth('   ', validPartnerName)).toThrow(ValidationError);
      expect(() => new PartnerAuth('   ', validPartnerName)).toThrow('Partner API key cannot be empty');
    });

    it('should throw ValidationError for non-string API key', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth(null, validPartnerName)).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth(undefined, validPartnerName)).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth(123, validPartnerName)).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth({}, validPartnerName)).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string partner name', () => {
      expect(() => new PartnerAuth(validApiKey, '')).toThrow(ValidationError);
      expect(() => new PartnerAuth(validApiKey, '')).toThrow('Partner name is required');
    });

    it('should throw ValidationError for whitespace-only partner name', () => {
      expect(() => new PartnerAuth(validApiKey, '   ')).toThrow(ValidationError);
      expect(() => new PartnerAuth(validApiKey, '   ')).toThrow('Partner name cannot be empty');
    });

    it('should throw ValidationError for non-string partner name', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth(validApiKey, null)).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth(validApiKey, undefined)).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new PartnerAuth(validApiKey, 123)).toThrow(ValidationError);
    });

    it('should accept API key with special characters', () => {
      const auth = new PartnerAuth('api-key_with.special@chars!123', validPartnerName);
      expect(auth.getApiKey()).toBe('api-key_with.special@chars!123');
    });

    it('should accept long API key', () => {
      const longKey = 'a'.repeat(256);
      const auth = new PartnerAuth(longKey, validPartnerName);
      expect(auth.getApiKey()).toBe(longKey);
    });
  });

  describe('getHeaders', () => {
    it('should return headers with X-Partner-API-Key and X-Partner-Name', () => {
      const apiKey = 'test-api-key-12345';
      const partnerName = 'my-partner';
      const auth = new PartnerAuth(apiKey, partnerName);
      
      const headers = auth.getHeaders();
      
      expect(headers).toEqual({
        'X-Partner-API-Key': apiKey,
        'X-Partner-Name': partnerName,
      });
    });

    it('should return new object on each call', () => {
      const auth = new PartnerAuth('test-key', 'test-partner');
      
      const headers1 = auth.getHeaders();
      const headers2 = auth.getHeaders();
      
      expect(headers1).toEqual(headers2);
      expect(headers1).not.toBe(headers2); // Different object instances
    });

    it('should not expose internal state through returned headers', () => {
      const auth = new PartnerAuth('test-key', 'test-partner');
      const headers = auth.getHeaders();
      
      // Mutating returned headers should not affect future calls
      headers['X-Partner-API-Key'] = 'modified';
      headers['X-Partner-Name'] = 'modified';
      
      const newHeaders = auth.getHeaders();
      expect(newHeaders['X-Partner-API-Key']).toBe('test-key');
      expect(newHeaders['X-Partner-Name']).toBe('test-partner');
    });
  });

  describe('getApiKey', () => {
    it('should return the API key', () => {
      const apiKey = 'my-secret-key';
      const auth = new PartnerAuth(apiKey, validPartnerName);
      
      expect(auth.getApiKey()).toBe(apiKey);
    });

    it('should return the original API key without modification', () => {
      const apiKey = '  key-with-spaces  ';
      const auth = new PartnerAuth(apiKey, validPartnerName);
      
      expect(auth.getApiKey()).toBe(apiKey);
    });
  });

  describe('getPartnerName', () => {
    it('should return the partner name', () => {
      const partnerName = 'my-partner';
      const auth = new PartnerAuth(validApiKey, partnerName);
      
      expect(auth.getPartnerName()).toBe(partnerName);
    });

    it('should return the original partner name without modification', () => {
      const partnerName = '  name-with-spaces  ';
      const auth = new PartnerAuth(validApiKey, partnerName);
      
      expect(auth.getPartnerName()).toBe(partnerName);
    });
  });

  describe('hasApiKey', () => {
    it('should return true when API key is set', () => {
      const auth = new PartnerAuth('test-key', validPartnerName);
      expect(auth.hasApiKey()).toBe(true);
    });

    it('should return true for any valid key', () => {
      const auth1 = new PartnerAuth('a', validPartnerName);
      const auth2 = new PartnerAuth('very-long-api-key-123456789', validPartnerName);
      
      expect(auth1.hasApiKey()).toBe(true);
      expect(auth2.hasApiKey()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle API key with only numbers', () => {
      const auth = new PartnerAuth('123456789', validPartnerName);
      expect(auth.getApiKey()).toBe('123456789');
      expect(auth.hasApiKey()).toBe(true);
    });

    it('should handle API key starting/ending with special chars', () => {
      const auth = new PartnerAuth('_start-and-end_', validPartnerName);
      expect(auth.getApiKey()).toBe('_start-and-end_');
    });

    it('should handle single character API key', () => {
      const auth = new PartnerAuth('x', validPartnerName);
      expect(auth.getApiKey()).toBe('x');
      expect(auth.hasApiKey()).toBe(true);
    });

    it('should handle partner name with numbers and special chars', () => {
      const auth = new PartnerAuth(validApiKey, 'partner-123_test');
      expect(auth.getPartnerName()).toBe('partner-123_test');
    });
  });
});
