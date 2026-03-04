import './setup.js';
import { Giza } from '../../src';
import { Address } from '../../src/types/common';
import { getState, setState } from './helpers/state';

describe('02 — Chain-level queries', () => {
  let giza: Giza;
  let token: Address;

  beforeAll(() => {
    const state = getState();
    giza = new Giza({ chain: state.chain });
    token = state.token;
  });

  it('tokens() returns response including USDC token', async () => {
    const res = await giza.tokens();

    // API returns { token_addresses: string[] } at runtime
    const raw = res as unknown as Record<string, unknown>;
    const addresses = raw.token_addresses;

    if (Array.isArray(addresses)) {
      // Current API shape: flat address list
      const lower = addresses.map((a: string) =>
        a.toLowerCase(),
      );
      expect(lower).toContain(token.toLowerCase());
    } else if (Array.isArray(res.tokens)) {
      // SDK-typed shape: full token objects
      const usdc = res.tokens.find(
        (t) =>
          t.address.toLowerCase() === token.toLowerCase(),
      );
      expect(usdc).toBeDefined();
    } else {
      // Unknown shape — dump for debugging
      fail(
        `Unexpected tokens() response shape: ${JSON.stringify(Object.keys(raw))}`,
      );
    }
  });

  it('stats() returns numeric fields and liquidity distribution', async () => {
    const res = await giza.stats();

    expect(typeof res.total_balance).toBe('number');
    expect(typeof res.total_deposits).toBe('number');
    expect(typeof res.total_users).toBe('number');
    expect(typeof res.total_transactions).toBe('number');
    expect(typeof res.total_apr).toBe('number');

    const ld = res.liquidity_distribution;
    expect(Array.isArray(ld.initial_deposits)).toBe(true);
    expect(Array.isArray(ld.current_tokens)).toBe(true);
    expect(Array.isArray(ld.protocols)).toBe(true);
  });

  it('tvl() returns non-negative number or is not implemented', async () => {
    try {
      const res = await giza.tvl();
      expect(typeof res.tvl).toBe('number');
      expect(res.tvl).toBeGreaterThanOrEqual(0);
    } catch (err: unknown) {
      // Backend returns 501 — endpoint not yet implemented
      expect(err).toHaveProperty('statusCode');
      expect((err as { statusCode: number }).statusCode).toBe(
        501,
      );
    }
  });

  it('protocols(token) returns string array with >= 1 entry', async () => {
    const res = await giza.protocols(token);

    expect(Array.isArray(res.protocols)).toBe(true);
    expect(res.protocols.length).toBeGreaterThanOrEqual(1);

    for (const name of res.protocols) {
      expect(typeof name).toBe('string');
    }

    setState({ availableProtocols: res.protocols });
  });

  it('protocolSupply(token) returns supply data per protocol', async () => {
    const res = await giza.protocolSupply(token);

    if (Array.isArray(res.protocols)) {
      // SDK-typed shape: ProtocolSupply[]
      for (const entry of res.protocols) {
        expect(typeof entry.protocol).toBe('string');
        expect(typeof entry.supply).toBe('number');
        expect(Array.isArray(entry.tokens)).toBe(true);
      }
    } else {
      // Current API shape: { [protocol]: { [tokenAddr]: number } }
      const raw = res as unknown as Record<
        string,
        Record<string, number>
      >;
      const keys = Object.keys(raw);
      expect(keys.length).toBeGreaterThanOrEqual(1);

      for (const protocol of keys) {
        expect(typeof protocol).toBe('string');
        const tokenMap = raw[protocol];
        expect(typeof tokenMap).toBe('object');
      }
    }
  });
});
