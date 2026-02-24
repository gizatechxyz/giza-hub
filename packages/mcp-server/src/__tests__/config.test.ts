import { resolveConfig } from '../config.js';
import { Giza, Chain } from '@gizatech/agent-sdk';

describe('resolveConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('accepts a pre-built Giza instance (tier 3)', () => {
    const giza = new Giza({
      chain: Chain.BASE,
      apiKey: 'test-key',
      partner: 'test-partner',
      apiUrl: 'https://api.test.com',
    });

    const config = resolveConfig({ giza });
    expect(config.giza).toBe(giza);
    expect(config.name).toBe('giza-yield-server');
    expect(config.transport).toBe('stdio');
    expect(config.tools.length).toBeGreaterThan(0);
  });

  it('reads chain, transport, port from env vars', () => {
    process.env['GIZA_API_KEY'] = 'key';
    process.env['GIZA_PARTNER_NAME'] = 'partner';
    process.env['GIZA_API_URL'] = 'https://api.test.com';
    process.env['GIZA_CHAIN_ID'] = '8453';
    process.env['TRANSPORT'] = 'http';
    process.env['PORT'] = '4000';

    const config = resolveConfig();
    expect(config.transport).toBe('http');
    expect(config.port).toBe(4000);
  });

  it('uses explicit config over env vars', () => {
    process.env['GIZA_API_KEY'] = 'env-key';
    process.env['GIZA_PARTNER_NAME'] = 'env-partner';
    process.env['GIZA_API_URL'] = 'https://env.test.com';

    const config = resolveConfig({
      chain: Chain.BASE,
      apiKey: 'explicit-key',
      partner: 'explicit-partner',
      apiUrl: 'https://explicit.test.com',
      name: 'custom-server',
      transport: 'http',
      port: 5000,
    });

    expect(config.name).toBe('custom-server');
    expect(config.transport).toBe('http');
    expect(config.port).toBe(5000);
  });

  it('defaults to stdio transport and port 3000', () => {
    const giza = new Giza({
      chain: Chain.BASE,
      apiKey: 'key',
      partner: 'partner',
      apiUrl: 'https://api.test.com',
    });

    const config = resolveConfig({ giza });
    expect(config.transport).toBe('stdio');
    expect(config.port).toBe(3000);
  });
});
