import { GizaAgent } from '../../src/client';
import { Chain, ValidationError } from '../../src/types/common';
import { setupTestEnv, clearTestEnv, restoreEnv } from '../helpers/test-env';

describe('GizaAgent', () => {
  beforeEach(() => {
    setupTestEnv();
  });

  afterEach(() => {
    restoreEnv();
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza).toBeInstanceOf(GizaAgent);
    });

    it('should initialize agent module', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.agent).toBeDefined();
    });

    it('should throw ValidationError when GIZA_API_KEY is missing', () => {
      clearTestEnv();
      process.env.GIZA_API_URL = 'https://api.test.giza.example';

      expect(() => new GizaAgent({ chainId: Chain.BASE })).toThrow(ValidationError);
      expect(() => new GizaAgent({ chainId: Chain.BASE })).toThrow(
        'GIZA_API_KEY environment variable is required'
      );
    });

    it('should throw ValidationError when GIZA_API_URL is missing', () => {
      clearTestEnv();
      process.env.GIZA_API_KEY = 'test-key';

      expect(() => new GizaAgent({ chainId: Chain.BASE })).toThrow(ValidationError);
      expect(() => new GizaAgent({ chainId: Chain.BASE })).toThrow(
        'GIZA_API_URL environment variable is required'
      );
    });

    it('should throw ValidationError when chainId is missing', () => {
      // @ts-expect-error - Testing missing required field
      expect(() => new GizaAgent({})).toThrow(ValidationError);
      // @ts-expect-error - Testing missing required field
      expect(() => new GizaAgent({})).toThrow('chainId is required');
    });

    it('should throw ValidationError when chainId is null', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new GizaAgent({ chainId: null })).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new GizaAgent({ chainId: null })).toThrow('chainId is required');
    });

    it('should throw ValidationError when chainId is undefined', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new GizaAgent({ chainId: undefined })).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new GizaAgent({ chainId: undefined })).toThrow('chainId is required');
    });

    it('should throw ValidationError for invalid chainId', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => new GizaAgent({ chainId: 999999 })).toThrow(ValidationError);
      // @ts-expect-error - Testing invalid input
      expect(() => new GizaAgent({ chainId: 999999 })).toThrow('chainId must be one of');
    });

    it('should throw ValidationError for invalid GIZA_API_URL format', () => {
      process.env.GIZA_API_URL = 'not-a-valid-url';

      expect(() => new GizaAgent({ chainId: Chain.BASE })).toThrow(ValidationError);
      expect(() => new GizaAgent({ chainId: Chain.BASE })).toThrow('backendUrl must be a valid URL');
    });

    it('should throw ValidationError for negative timeout', () => {
      expect(() => new GizaAgent({ chainId: Chain.BASE, timeout: -1000 })).toThrow(
        ValidationError
      );
      expect(() => new GizaAgent({ chainId: Chain.BASE, timeout: -1000 })).toThrow(
        'timeout must be a positive number'
      );
    });

    it('should throw ValidationError for zero timeout', () => {
      expect(() => new GizaAgent({ chainId: Chain.BASE, timeout: 0 })).toThrow(ValidationError);
      expect(() => new GizaAgent({ chainId: Chain.BASE, timeout: 0 })).toThrow(
        'timeout must be a positive number'
      );
    });

    it('should throw ValidationError for Infinity timeout', () => {
      expect(() => new GizaAgent({ chainId: Chain.BASE, timeout: Infinity })).toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError for NaN timeout', () => {
      expect(() => new GizaAgent({ chainId: Chain.BASE, timeout: NaN })).toThrow(
        ValidationError
      );
    });

    it('should accept valid custom timeout', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE, timeout: 30000 });
      expect(giza.getConfig().timeout).toBe(30000);
    });

    it('should accept BASE chain', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getChainId()).toBe(Chain.BASE);
    });

    it('should accept ARBITRUM chain', () => {
      const giza = new GizaAgent({ chainId: Chain.ARBITRUM });
      expect(giza.getChainId()).toBe(Chain.ARBITRUM);
    });
  });

  describe('config resolution', () => {
    it('should apply default agent ID when not provided', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getAgentId()).toBe('arma-dev');
    });

    it('should use provided agent ID', () => {
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'custom-agent',
      });
      expect(giza.getAgentId()).toBe('custom-agent');
    });

    it('should apply default timeout when not provided', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getConfig().timeout).toBe(45000);
    });

    it('should use provided timeout', () => {
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        timeout: 60000,
      });
      expect(giza.getConfig().timeout).toBe(60000);
    });

    it('should apply default enableRetry as false', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getConfig().enableRetry).toBe(false);
    });

    it('should use provided enableRetry true', () => {
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });
      expect(giza.getConfig().enableRetry).toBe(true);
    });

    it('should use provided enableRetry false', () => {
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: false,
      });
      expect(giza.getConfig().enableRetry).toBe(false);
    });

    it('should strip trailing slash from backendUrl', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example/';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('https://api.test.giza.example');
    });

    it('should not modify backendUrl without trailing slash', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('https://api.test.giza.example');
    });

    it('should handle multiple trailing slashes', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example///';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('https://api.test.giza.example//');
    });
  });

  describe('getConfig', () => {
    it('should return config without API key', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      const config = giza.getConfig();

      expect(config).toHaveProperty('backendUrl');
      expect(config).toHaveProperty('chainId');
      expect(config).toHaveProperty('agentId');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('enableRetry');
      expect(config).not.toHaveProperty('partnerApiKey');
    });

    it('should return correct config values', () => {
      const giza = new GizaAgent({
        chainId: Chain.ARBITRUM,
        agentId: 'test-agent',
        timeout: 20000,
        enableRetry: true,
      });
      const config = giza.getConfig();

      expect(config.chainId).toBe(Chain.ARBITRUM);
      expect(config.agentId).toBe('test-agent');
      expect(config.timeout).toBe(20000);
      expect(config.enableRetry).toBe(true);
      expect(config.backendUrl).toBe('https://api.test.giza.example');
    });
  });

  describe('getChainId', () => {
    it('should return BASE chain ID', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getChainId()).toBe(8453);
    });

    it('should return ARBITRUM chain ID', () => {
      const giza = new GizaAgent({ chainId: Chain.ARBITRUM });
      expect(giza.getChainId()).toBe(42161);
    });
  });

  describe('getBackendUrl', () => {
    it('should return the backend URL', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('https://api.test.giza.example');
    });

    it('should return URL from environment', () => {
      process.env.GIZA_API_URL = 'https://custom.backend.url';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('https://custom.backend.url');
    });
  });

  describe('getAgentId', () => {
    it('should return default agent ID', () => {
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getAgentId()).toBe('arma-dev');
    });

    it('should return custom agent ID', () => {
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'my-custom-agent',
      });
      expect(giza.getAgentId()).toBe('my-custom-agent');
    });

    it('should use default when empty string agent ID provided', () => {
      // Empty string is falsy, so it uses the default
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        agentId: '',
      });
      expect(giza.getAgentId()).toBe('arma-dev');
    });
  });

  describe('module initialization', () => {
    it('should initialize AgentModule with correct config', () => {
      const giza = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'test-agent',
      });

      expect(giza.agent).toBeDefined();
      expect(typeof giza.agent.createSmartAccount).toBe('function');
      expect(typeof giza.agent.getSmartAccount).toBe('function');
      expect(typeof giza.agent.activate).toBe('function');
      expect(typeof giza.agent.deactivate).toBe('function');
      expect(typeof giza.agent.getPerformance).toBe('function');
      expect(typeof giza.agent.withdraw).toBe('function');
    });
  });

  describe('environment variable edge cases', () => {
    it('should handle whitespace in API key', () => {
      process.env.GIZA_API_KEY = '  test-key  ';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza).toBeInstanceOf(GizaAgent);
    });

    it('should handle URLs with ports', () => {
      process.env.GIZA_API_URL = 'http://localhost:3000';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('http://localhost:3000');
    });

    it('should handle URLs with paths', () => {
      process.env.GIZA_API_URL = 'https://api.example.com/v1/giza';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('https://api.example.com/v1/giza');
    });

    it('should handle http URLs', () => {
      process.env.GIZA_API_URL = 'http://api.example.com';
      const giza = new GizaAgent({ chainId: Chain.BASE });
      expect(giza.getBackendUrl()).toBe('http://api.example.com');
    });
  });

  describe('multiple instances', () => {
    it('should allow creating multiple instances', () => {
      const giza1 = new GizaAgent({ chainId: Chain.BASE });
      const giza2 = new GizaAgent({ chainId: Chain.ARBITRUM });

      expect(giza1.getChainId()).toBe(Chain.BASE);
      expect(giza2.getChainId()).toBe(Chain.ARBITRUM);
    });

    it('should not share state between instances', () => {
      const giza1 = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'agent-1',
      });
      const giza2 = new GizaAgent({
        chainId: Chain.ARBITRUM,
        agentId: 'agent-2',
      });

      expect(giza1.getAgentId()).toBe('agent-1');
      expect(giza2.getAgentId()).toBe('agent-2');
      expect(giza1.getChainId()).toBe(Chain.BASE);
      expect(giza2.getChainId()).toBe(Chain.ARBITRUM);
    });
  });
});
