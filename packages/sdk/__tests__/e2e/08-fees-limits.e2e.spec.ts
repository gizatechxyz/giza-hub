import './setup.js';
import { Giza, Agent } from '../../src';
import { getState } from './helpers/state';
import { ifState } from './helpers/skip';

describe('08 — Fees, limits & claim rewards', () => {
  let giza: Giza;
  let agent: Agent;

  beforeAll(() => {
    const state = getState();
    giza = new Giza({ chain: state.chain });
    if (state.walletAddress) {
      agent = giza.agent(state.walletAddress);
    }
  });

  const test = ifState('walletAddress', 'agentActivated');

  test(
    'fees() returns non-negative percentage_fee and fee',
    async () => {
      const res = await agent.fees();

      expect(typeof res.percentage_fee).toBe('number');
      expect(res.percentage_fee).toBeGreaterThanOrEqual(0);
      expect(typeof res.fee).toBe('number');
      expect(res.fee).toBeGreaterThanOrEqual(0);
    },
  );

  test('limit(eoa) returns numeric limit', async () => {
    const state = getState();
    const res = await agent.limit(state.eoa);

    expect(typeof res.limit).toBe('number');
  });

  test('claimRewards() returns rewards array', async () => {
    const res = await agent.claimRewards();

    expect(Array.isArray(res.rewards)).toBe(true);
    for (const reward of res.rewards) {
      expect(typeof reward.token).toBe('string');
      expect(typeof reward.amount).toBe('number');
      expect(typeof reward.amount_float).toBe('number');
      expect(typeof reward.current_price_in_underlying).toBe(
        'number',
      );
    }
  });
});
