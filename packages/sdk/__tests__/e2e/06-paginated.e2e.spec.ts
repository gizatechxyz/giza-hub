import './setup.js';
import { Giza, Agent } from '../../src';
import { getState, setState } from './helpers/state';
import { ifState } from './helpers/skip';

describe('06 — Paginated collections', () => {
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

  // -----------------------------------------------------------
  // transactions()
  // -----------------------------------------------------------

  describe('transactions()', () => {
    test('first(5) returns array', async () => {
      const items = await agent.transactions().first(5);

      expect(Array.isArray(items)).toBe(true);
      for (const tx of items) {
        expect(typeof tx.action).toBe('string');
        expect(typeof tx.date).toBe('string');
        expect(typeof tx.amount).toBe('number');
      }
    });

    test('page(1) returns paginated response', async () => {
      const res = await agent
        .transactions({ sort: 'date_desc' })
        .page(1, { limit: 3 });

      expect(Array.isArray(res.items)).toBe(true);
      expect(typeof res.total).toBe('number');
      expect(res.page).toBe(1);
      expect(res.limit).toBe(3);
      expect(typeof res.hasMore).toBe('boolean');
    });

    test('async iterator yields items', async () => {
      const collected: unknown[] = [];
      let count = 0;
      for await (const tx of agent.transactions({ limit: 5 })) {
        collected.push(tx);
        count++;
        if (count >= 10) break;
      }
      expect(Array.isArray(collected)).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // executions()
  // -----------------------------------------------------------

  describe('executions()', () => {
    test('first(5) returns array with id and status', async () => {
      const items = await agent.executions().first(5);

      expect(Array.isArray(items)).toBe(true);
      if (items.length > 0) {
        expect(typeof items[0].id).toBe('string');
        expect(typeof items[0].status).toBe('string');
        setState({ firstExecutionId: items[0].id });
      }
    });

    test('page(1) returns paginated response', async () => {
      const res = await agent.executions().page(1, { limit: 3 });

      expect(Array.isArray(res.items)).toBe(true);
      expect(typeof res.total).toBe('number');
    });

    test('async iterator yields items', async () => {
      const collected: unknown[] = [];
      let count = 0;
      for await (const exec of agent.executions({ limit: 5 })) {
        collected.push(exec);
        count++;
        if (count >= 10) break;
      }
      expect(Array.isArray(collected)).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // executionLogs()
  // -----------------------------------------------------------

  describe('executionLogs()', () => {
    it('first(5) returns array with type and data', async () => {
      const state = getState();
      if (!state.walletAddress || !state.firstExecutionId) {
        return;
      }

      const items = await agent
        .executionLogs(state.firstExecutionId)
        .first(5);

      expect(Array.isArray(items)).toBe(true);
      for (const log of items) {
        expect(typeof log.type).toBe('string');
        expect(log).toHaveProperty('data');
      }
    });

    it('page(1) returns paginated response', async () => {
      const state = getState();
      if (!state.walletAddress || !state.firstExecutionId) {
        return;
      }

      const res = await agent
        .executionLogs(state.firstExecutionId)
        .page(1, { limit: 3 });

      expect(Array.isArray(res.items)).toBe(true);
      expect(typeof res.total).toBe('number');
    });
  });

  // -----------------------------------------------------------
  // logs()
  // -----------------------------------------------------------

  describe('logs()', () => {
    test('first(5) returns array with type', async () => {
      const items = await agent.logs().first(5);

      expect(Array.isArray(items)).toBe(true);
      for (const log of items) {
        expect(typeof log.type).toBe('string');
      }
    });

    test('page(1) returns paginated response', async () => {
      const res = await agent.logs().page(1, { limit: 3 });

      expect(Array.isArray(res.items)).toBe(true);
      expect(typeof res.total).toBe('number');
    });

    test('async iterator yields items', async () => {
      const collected: unknown[] = [];
      let count = 0;
      for await (const log of agent.logs({ limit: 5 })) {
        collected.push(log);
        count++;
        if (count >= 10) break;
      }
      expect(Array.isArray(collected)).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // rewards()
  // -----------------------------------------------------------

  describe('rewards()', () => {
    test('first(5) returns array', async () => {
      const items = await agent.rewards().first(5);

      expect(Array.isArray(items)).toBe(true);
      for (const r of items) {
        expect(typeof r.id).toBe('string');
        expect(typeof r.reward_amount).toBe('number');
      }
    });

    test('page(1) returns paginated response', async () => {
      const res = await agent.rewards().page(1, { limit: 3 });

      expect(Array.isArray(res.items)).toBe(true);
      expect(typeof res.total).toBe('number');
    });

    test('async iterator yields items', async () => {
      const collected: unknown[] = [];
      let count = 0;
      for await (const r of agent.rewards({ limit: 5 })) {
        collected.push(r);
        count++;
        if (count >= 10) break;
      }
      expect(Array.isArray(collected)).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // rewardHistory()
  // -----------------------------------------------------------

  describe('rewardHistory()', () => {
    test('first(5) returns array', async () => {
      const items = await agent.rewardHistory().first(5);

      expect(Array.isArray(items)).toBe(true);
    });

    test('async iterator yields items', async () => {
      const collected: unknown[] = [];
      let count = 0;
      for await (const r of agent.rewardHistory({ limit: 5 })) {
        collected.push(r);
        count++;
        if (count >= 10) break;
      }
      expect(Array.isArray(collected)).toBe(true);
    });
  });
});
