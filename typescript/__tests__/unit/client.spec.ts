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
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent).toBeInstanceOf(GizaAgent);
    });

    it('should initialize smartAccount module', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.smartAccount).toBeDefined();
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
      const agent = new GizaAgent({ chainId: Chain.BASE, timeout: 30000 });
      expect(agent.getConfig().timeout).toBe(30000);
    });

    it('should accept BASE chain', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getChainId()).toBe(Chain.BASE);
    });

    it('should accept ARBITRUM chain', () => {
      const agent = new GizaAgent({ chainId: Chain.ARBITRUM });
      expect(agent.getChainId()).toBe(Chain.ARBITRUM);
    });
  });

  describe('config resolution', () => {
    it('should apply default agent ID when not provided', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getAgentId()).toBe('arma-dev');
    });

    it('should use provided agent ID', () => {
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'custom-agent',
      });
      expect(agent.getAgentId()).toBe('custom-agent');
    });

    it('should apply default timeout when not provided', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getConfig().timeout).toBe(45000);
    });

    it('should use provided timeout', () => {
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        timeout: 60000,
      });
      expect(agent.getConfig().timeout).toBe(60000);
    });

    it('should apply default enableRetry as false', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getConfig().enableRetry).toBe(false);
    });

    it('should use provided enableRetry true', () => {
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: true,
      });
      expect(agent.getConfig().enableRetry).toBe(true);
    });

    it('should use provided enableRetry false', () => {
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        enableRetry: false,
      });
      expect(agent.getConfig().enableRetry).toBe(false);
    });

    it('should strip trailing slash from backendUrl', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example/';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('https://api.test.giza.example');
    });

    it('should not modify backendUrl without trailing slash', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('https://api.test.giza.example');
    });

    it('should handle multiple trailing slashes', () => {
      process.env.GIZA_API_URL = 'https://api.test.giza.example///';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('https://api.test.giza.example//');
    });
  });

  describe('getConfig', () => {
    it('should return config without API key', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      const config = agent.getConfig();

      expect(config).toHaveProperty('backendUrl');
      expect(config).toHaveProperty('chainId');
      expect(config).toHaveProperty('agentId');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('enableRetry');
      expect(config).not.toHaveProperty('partnerApiKey');
    });

    it('should return correct config values', () => {
      const agent = new GizaAgent({
        chainId: Chain.ARBITRUM,
        agentId: 'test-agent',
        timeout: 20000,
        enableRetry: true,
      });
      const config = agent.getConfig();

      expect(config.chainId).toBe(Chain.ARBITRUM);
      expect(config.agentId).toBe('test-agent');
      expect(config.timeout).toBe(20000);
      expect(config.enableRetry).toBe(true);
      expect(config.backendUrl).toBe('https://api.test.giza.example');
    });
  });

  describe('getChainId', () => {
    it('should return BASE chain ID', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getChainId()).toBe(8453);
    });

    it('should return ARBITRUM chain ID', () => {
      const agent = new GizaAgent({ chainId: Chain.ARBITRUM });
      expect(agent.getChainId()).toBe(42161);
    });
  });

  describe('getBackendUrl', () => {
    it('should return the backend URL', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('https://api.test.giza.example');
    });

    it('should return URL from environment', () => {
      process.env.GIZA_API_URL = 'https://custom.backend.url';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('https://custom.backend.url');
    });
  });

  describe('getAgentId', () => {
    it('should return default agent ID', () => {
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getAgentId()).toBe('arma-dev');
    });

    it('should return custom agent ID', () => {
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'my-custom-agent',
      });
      expect(agent.getAgentId()).toBe('my-custom-agent');
    });

    it('should use default when empty string agent ID provided', () => {
      // Empty string is falsy, so it uses the default
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: '',
      });
      expect(agent.getAgentId()).toBe('arma-dev');
    });
  });

  describe('module initialization', () => {
    it('should initialize SmartAccountModule with correct config', () => {
      const agent = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'test-agent',
      });

      expect(agent.smartAccount).toBeDefined();
      expect(typeof agent.smartAccount.create).toBe('function');
      expect(typeof agent.smartAccount.getInfo).toBe('function');
      expect(typeof agent.smartAccount.updatePermissions).toBe('function');
    });
  });

  describe('environment variable edge cases', () => {
    it('should handle whitespace in API key', () => {
      process.env.GIZA_API_KEY = '  test-key  ';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent).toBeInstanceOf(GizaAgent);
    });

    it('should handle URLs with ports', () => {
      process.env.GIZA_API_URL = 'http://localhost:3000';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('http://localhost:3000');
    });

    it('should handle URLs with paths', () => {
      process.env.GIZA_API_URL = 'https://api.example.com/v1/giza';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('https://api.example.com/v1/giza');
    });

    it('should handle http URLs', () => {
      process.env.GIZA_API_URL = 'http://api.example.com';
      const agent = new GizaAgent({ chainId: Chain.BASE });
      expect(agent.getBackendUrl()).toBe('http://api.example.com');
    });
  });

  describe('multiple instances', () => {
    it('should allow creating multiple instances', () => {
      const agent1 = new GizaAgent({ chainId: Chain.BASE });
      const agent2 = new GizaAgent({ chainId: Chain.ARBITRUM });

      expect(agent1.getChainId()).toBe(Chain.BASE);
      expect(agent2.getChainId()).toBe(Chain.ARBITRUM);
    });

    it('should not share state between instances', () => {
      const agent1 = new GizaAgent({
        chainId: Chain.BASE,
        agentId: 'agent-1',
      });
      const agent2 = new GizaAgent({
        chainId: Chain.ARBITRUM,
        agentId: 'agent-2',
      });

      expect(agent1.getAgentId()).toBe('agent-1');
      expect(agent2.getAgentId()).toBe('agent-2');
      expect(agent1.getChainId()).toBe(Chain.BASE);
      expect(agent2.getChainId()).toBe(Chain.ARBITRUM);
    });
  });
});

