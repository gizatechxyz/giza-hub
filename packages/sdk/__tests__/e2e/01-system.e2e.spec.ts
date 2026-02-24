import { Giza, Chain } from '../../src';
import { getState } from './helpers/state';

describe('01 — System endpoints', () => {
  let giza: Giza;

  beforeAll(() => {
    const { chain } = getState();
    giza = new Giza({ chain });
  });

  it('health() returns message, version, and parseable time', async () => {
    const res = await giza.health();

    expect(typeof res.message).toBe('string');
    expect(typeof res.version).toBe('string');
    expect(typeof res.time).toBe('string');
    expect(Number.isNaN(Date.parse(res.time))).toBe(false);
  });

  it('getApiConfig() returns numeric thresholds and config objects', async () => {
    const res = await giza.getApiConfig();

    expect(typeof res.min_withdraw_usd).toBe('number');
    expect(typeof res.optimizer_threshold_usd).toBe('number');
    expect(typeof res.max_protocol_liquidity_percentage).toBe(
      'number',
    );
    expect(typeof res.constraints).toBe('object');
    expect(typeof res.chains).toBe('object');
  });

  it('chains() includes BASE (8453)', async () => {
    const res = await giza.chains();

    expect(Array.isArray(res.chain_ids)).toBe(true);
    expect(res.chain_ids).toContain(8453);
  });

  it('getChain() returns Chain.BASE', () => {
    expect(giza.getChain()).toBe(Chain.BASE);
  });

  it('getApiUrl() returns a valid URL matching env var', () => {
    const url = giza.getApiUrl();
    const expected = (process.env.GIZA_API_URL ?? '').replace(
      /\/$/,
      '',
    );

    expect(() => new URL(url)).not.toThrow();
    expect(url).toBe(expected);
  });
});
