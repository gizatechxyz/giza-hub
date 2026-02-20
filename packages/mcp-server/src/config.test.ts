import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GIZA_API_KEY = 'test-key';
    process.env.GIZA_PARTNER_NAME = 'test-partner';
    process.env.GIZA_CHAIN_ID = '8453';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('loads valid config with required env vars', () => {
    const config = loadConfig();
    expect(config.gizaApiKey).toBe('test-key');
    expect(config.gizaPartnerName).toBe('test-partner');
    expect(config.gizaChainId).toBe(8453);
    expect(config.transport).toBe('stdio');
    expect(config.port).toBe(3000);
  });

  it('uses custom GIZA_API_URL when provided', () => {
    process.env.GIZA_API_URL = 'https://custom.api.com';
    const config = loadConfig();
    expect(config.gizaApiUrl).toBe('https://custom.api.com');
  });

  it('accepts Arbitrum chain ID', () => {
    process.env.GIZA_CHAIN_ID = '42161';
    const config = loadConfig();
    expect(config.gizaChainId).toBe(42161);
  });

  it('accepts http transport', () => {
    process.env.TRANSPORT = 'http';
    process.env.PORT = '8080';
    const config = loadConfig();
    expect(config.transport).toBe('http');
    expect(config.port).toBe(8080);
  });

  it('throws on missing GIZA_API_KEY', () => {
    delete process.env.GIZA_API_KEY;
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });

  it('throws on missing GIZA_PARTNER_NAME', () => {
    delete process.env.GIZA_PARTNER_NAME;
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });

  it('throws on missing GIZA_CHAIN_ID', () => {
    delete process.env.GIZA_CHAIN_ID;
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });

  it('throws on invalid chain ID', () => {
    process.env.GIZA_CHAIN_ID = '1';
    expect(() => loadConfig()).toThrow('Invalid configuration');
  });
});
