import { Giza } from '../../src/giza';
import { Chain, ValidationError } from '../../src/types/common';
import { setupTestEnv, clearTestEnv, restoreEnv } from '../helpers/test-env';

describe('Giza', () => {
  beforeEach(() => {
    setupTestEnv();
  });

  afterEach(() => {
    restoreEnv();
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza).toBeInstanceOf(Giza);
    });

    it('should allow no-auth mode when apiKey and partner are both missing', () => {
      clearTestEnv();
      process.env.GIZA_API_URL = 'https://api.test.giza.example';

      const giza = new Giza({ chain: Chain.BASE });
      expect(giza).toBeInstanceOf(Giza);
    });

    it('should throw ValidationError when apiKey is set but partner is missing', () => {
      clearTestEnv();
      process.env.GIZA_API_KEY = 'test-key';
      process.env.GIZA_API_URL = 'https://api.test.giza.example';

      expect(() => new Giza({ chain: Chain.BASE })).toThrow(ValidationError);
      expect(() => new Giza({ chain: Chain.BASE })).toThrow('Partner name is required');
    });

    it('should throw ValidationError when GIZA_PARTNER_NAME is missing', () => {
      clearTestEnv();
      process.env.GIZA_API_KEY = 'test-key';
      process.env.GIZA_API_URL = 'https://api.test.giza.example';

      expect(() => new Giza({ chain: Chain.BASE })).toThrow(ValidationError);
      expect(() => new Giza({ chain: Chain.BASE })).toThrow('Partner name is required');
    });

    it('should throw ValidationError when GIZA_API_URL is missing', () => {
      clearTestEnv();
      process.env.GIZA_API_KEY = 'test-key';
      process.env.GIZA_PARTNER_NAME = 'test-partner';

      expect(() => new Giza({ chain: Chain.BASE })).toThrow(ValidationError);
      expect(() => new Giza({ chain: Chain.BASE })).toThrow('API URL is required');
    });

    it('should throw ValidationError when chain is missing', () => {
      // @ts-expect-error - Testing missing required field
      expect(() => new Giza({})).toThrow(ValidationError);
      // @ts-expect-error - Testing missing required field
      expect(() => new Giza({})).toThrow('chain is required');
    });

    it('should throw ValidationError when chain is null', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new Giza({ chain: null })).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new Giza({ chain: null })).toThrow('chain is required');
    });

    it('should throw ValidationError when chain is undefined', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new Giza({ chain: undefined })).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new Giza({ chain: undefined })).toThrow('chain is required');
    });

    it('should throw ValidationError for invalid chain', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new Giza({ chain: 999999 })).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new Giza({ chain: 999999 })).toThrow('chainId must be one of');
    });

    it('should throw ValidationError for invalid apiUrl format', () => {
      process.env.GIZA_API_URL = 'not-a-valid-url';

      expect(() => new Giza({ chain: Chain.BASE })).toThrow(ValidationError);
      expect(() => new Giza({ chain: Chain.BASE })).toThrow('apiUrl must be a valid URL');
    });

    it('should throw ValidationError for negative timeout', () => {
      expect(() => new Giza({ chain: Chain.BASE, timeout: -1000 })).toThrow(ValidationError);
      expect(() => new Giza({ chain: Chain.BASE, timeout: -1000 })).toThrow(
        'timeout must be a positive number'
      );
    });

    it('should throw ValidationError for zero timeout', () => {
      expect(() => new Giza({ chain: Chain.BASE, timeout: 0 })).toThrow(ValidationError);
    });

    it('should throw ValidationError for Infinity timeout', () => {
      expect(() => new Giza({ chain: Chain.BASE, timeout: Infinity })).toThrow(ValidationError);
    });

    it('should throw ValidationError for NaN timeout', () => {
      expect(() => new Giza({ chain: Chain.BASE, timeout: NaN })).toThrow(ValidationError);
    });

    it('should accept valid custom timeout', () => {
      const giza = new Giza({ chain: Chain.BASE, timeout: 30000 });
      expect(giza).toBeInstanceOf(Giza);
    });

    it('should accept constructor credentials over env vars', () => {
      const giza = new Giza({
        chain: Chain.BASE,
        apiKey: 'ctor-key',
        partner: 'ctor-partner',
        apiUrl: 'https://ctor.example.com',
      });
      expect(giza.getApiUrl()).toBe('https://ctor.example.com');
    });

    it('should accept BASE chain', () => {
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getChain()).toBe(Chain.BASE);
    });

    it('should accept ARBITRUM chain', () => {
      const giza = new Giza({ chain: Chain.ARBITRUM });
      expect(giza.getChain()).toBe(Chain.ARBITRUM);
    });
  });

  describe('config resolution', () => {
    it('should strip trailing slash from apiUrl', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example/';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('https://api.test.giza.example');
    });

    it('should not modify apiUrl without trailing slash', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('https://api.test.giza.example');
    });
  });

  describe('getChain', () => {
    it('should return BASE chain ID', () => {
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getChain()).toBe(8453);
    });

    it('should return ARBITRUM chain ID', () => {
      const giza = new Giza({ chain: Chain.ARBITRUM });
      expect(giza.getChain()).toBe(42161);
    });
  });

  describe('getApiUrl', () => {
    it('should return the API URL', () => {
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('https://api.test.giza.example');
    });

    it('should return URL from environment', () => {
      process.env.GIZA_API_URL = 'https://custom.backend.url';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('https://custom.backend.url');
    });
  });

  describe('agent factory', () => {
    it('should create agent handle without API call', () => {
      const giza = new Giza({ chain: Chain.BASE });
      const agent = giza.agent('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      expect(agent.wallet).toBe('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    });

    it('should throw ValidationError for invalid wallet', () => {
      const giza = new Giza({ chain: Chain.BASE });
      expect(() => giza.agent('invalid' as any)).toThrow(ValidationError);
    });
  });

  describe('config errors', () => {
    it('should not expose GIZA_API_KEY env var name in partial partner errors', () => {
      clearTestEnv();
      process.env.GIZA_API_URL = 'https://api.test.giza.example';
      process.env.GIZA_API_KEY = 'test-key';
      expect(() => new Giza({ chain: Chain.BASE })).toThrow();
      try {
        new Giza({ chain: Chain.BASE });
      } catch (e: any) {
        expect(e.message).not.toContain('GIZA_API_KEY');
      }
    });
  });

  describe('bearer token auth', () => {
    it('should accept bearerToken without apiKey or partner', () => {
      clearTestEnv();
      process.env.GIZA_API_URL = 'https://api.test.giza.example';
      const giza = new Giza({
        chain: Chain.BASE,
        bearerToken: 'test-bearer-token',
      });
      expect(giza).toBeInstanceOf(Giza);
    });

    it('should skip apiKey/partner validation with bearerToken', () => {
      clearTestEnv();
      process.env.GIZA_API_URL = 'https://api.test.giza.example';
      expect(() => new Giza({
        chain: Chain.BASE,
        bearerToken: 'test-token',
      })).not.toThrow();
    });
  });

  describe('environment variable edge cases', () => {
    it('should handle whitespace in API key', () => {
      process.env.GIZA_API_KEY = '  test-key  ';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza).toBeInstanceOf(Giza);
    });

    it('should handle URLs with ports', () => {
      process.env.GIZA_API_URL = 'http://localhost:3000';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('http://localhost:3000');
    });

    it('should handle URLs with paths', () => {
      process.env.GIZA_API_URL = 'https://api.example.com/v1/giza';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('https://api.example.com/v1/giza');
    });

    it('should handle http URLs', () => {
      process.env.GIZA_API_URL = 'http://api.example.com';
      const giza = new Giza({ chain: Chain.BASE });
      expect(giza.getApiUrl()).toBe('http://api.example.com');
    });
  });

  describe('multiple instances', () => {
    it('should allow creating multiple instances', () => {
      const giza1 = new Giza({ chain: Chain.BASE });
      const giza2 = new Giza({ chain: Chain.ARBITRUM });

      expect(giza1.getChain()).toBe(Chain.BASE);
      expect(giza2.getChain()).toBe(Chain.ARBITRUM);
    });

    it('should not share state between instances', () => {
      const giza1 = new Giza({ chain: Chain.BASE });
      const giza2 = new Giza({ chain: Chain.ARBITRUM });

      expect(giza1.getChain()).toBe(Chain.BASE);
      expect(giza2.getChain()).toBe(Chain.ARBITRUM);
    });
  });
});
