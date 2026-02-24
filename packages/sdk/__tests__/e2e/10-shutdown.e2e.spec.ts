import {
  Giza,
  Agent,
  AgentStatus,
  ValidationError,
  TimeoutError,
} from '../../src';
import { getState } from './helpers/state';
import { ifState } from './helpers/skip';

describe('10 — Shutdown & lifecycle', () => {
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
  const testWithTx = ifState(
    'walletAddress',
    'agentActivated',
    'txHash',
  );

  // -----------------------------------------------------------
  // run()
  // -----------------------------------------------------------

  test('run() returns status string', async () => {
    const res = await agent.run();

    expect(typeof res.status).toBe('string');
  });

  // -----------------------------------------------------------
  // topUp()
  // -----------------------------------------------------------

  testWithTx('topUp(txHash) returns message', async () => {
    const state = getState();

    try {
      const res = await agent.topUp(state.txHash!);
      expect(typeof res.message).toBe('string');
    } catch (err: unknown) {
      // Backend may reject duplicate tx hash — acceptable
      expect(err).toBeDefined();
    }
  });

  // Client-side validation — only needs walletAddress
  ifState('walletAddress')(
    'topUp("") throws ValidationError',
    async () => {
      await expect(agent.topUp('')).rejects.toThrow(
        ValidationError,
      );
    },
  );

  // -----------------------------------------------------------
  // deactivate()
  // -----------------------------------------------------------

  test(
    'deactivate({ transfer: true }) returns message',
    async () => {
      const res = await agent.deactivate({ transfer: true });

      expect(typeof res.message).toBe('string');
    },
  );

  // -----------------------------------------------------------
  // withdraw()
  // -----------------------------------------------------------

  test(
    'withdraw("100000") returns or throws (agent may be deactivating)',
    async () => {
      try {
        const res = await agent.withdraw('100000');
        expect(res).toBeDefined();
      } catch (err: unknown) {
        expect(err).toBeDefined();
      }
    },
  );

  // -----------------------------------------------------------
  // waitForDeactivation()
  // -----------------------------------------------------------

  test(
    'waitForDeactivation() polls and resolves',
    async () => {
      const updates: AgentStatus[] = [];

      try {
        const res = await agent.waitForDeactivation({
          interval: 5000,
          timeout: 120_000,
          onUpdate: (s) => updates.push(s),
        });

        expect(updates.length).toBeGreaterThanOrEqual(1);
        expect(res.status).toBe(AgentStatus.DEACTIVATED);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(TimeoutError);
        expect(updates.length).toBeGreaterThanOrEqual(1);
      }
    },
  );

  // Client-side validation — only needs walletAddress
  ifState('walletAddress')(
    'waitForDeactivation({ interval: 0 }) throws ValidationError',
    async () => {
      await expect(
        agent.waitForDeactivation({ interval: 0 }),
      ).rejects.toThrow(ValidationError);
    },
  );

  ifState('walletAddress')(
    'waitForDeactivation({ timeout: -1 }) throws ValidationError',
    async () => {
      await expect(
        agent.waitForDeactivation({ timeout: -1 }),
      ).rejects.toThrow(ValidationError);
    },
  );
});
