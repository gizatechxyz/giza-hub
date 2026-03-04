import './setup.js';
import { Giza, AgentStatus, Period, Agent } from '../../src';
import { getState } from './helpers/state';
import { ifState } from './helpers/skip';

const VALID_STATUSES = Object.values(AgentStatus) as string[];

describe('05 — Portfolio & performance', () => {
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

  test('portfolio() returns expected shape', async () => {
    const res = await agent.portfolio();

    expect(typeof res.wallet).toBe('string');
    expect(VALID_STATUSES).toContain(res.status);
    expect(Array.isArray(res.deposits)).toBe(true);
    expect(typeof res.activation_date).toBe('string');
    expect(Array.isArray(res.selected_protocols)).toBe(true);
  });

  test('status() returns valid AgentStatus and matching wallet', async () => {
    const res = await agent.status();

    expect(VALID_STATUSES).toContain(res.status);
    expect(res.wallet).toBe(getState().walletAddress);
    expect(typeof res.activation_date).toBe('string');
  });

  test('performance() returns array (no options)', async () => {
    const res = await agent.performance();

    expect(Array.isArray(res.performance)).toBe(true);
  });

  test('performance() accepts from option', async () => {
    const res = await agent.performance({
      from: '2024-01-01 00:00:00',
    });

    expect(Array.isArray(res.performance)).toBe(true);
  });

  test('apr() returns non-negative number', async () => {
    const res = await agent.apr();

    expect(typeof res.apr).toBe('number');
    expect(res.apr).toBeGreaterThanOrEqual(0);
  });

  test('apr() accepts date range options', async () => {
    const res = await agent.apr({
      startDate: '2024-01-01',
      endDate: '2025-12-31',
    });

    expect(typeof res.apr).toBe('number');
  });

  test('aprByTokens() returns array (no period)', async () => {
    const res = await agent.aprByTokens();

    expect(Array.isArray(res)).toBe(true);
  });

  test('aprByTokens(Period.ALL) returns array', async () => {
    const res = await agent.aprByTokens(Period.ALL);

    expect(Array.isArray(res)).toBe(true);
  });

  test('deposits() returns deposits array', async () => {
    const res = await agent.deposits();

    expect(Array.isArray(res.deposits)).toBe(true);
  });
});
