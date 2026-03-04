import './setup.js';
import { Giza, Agent, ValidationError } from '../../src';
import { getState } from './helpers/state';
import { ifState } from './helpers/skip';

describe('07 — Protocol & constraint management', () => {
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
  const testWithProtocols = ifState(
    'walletAddress',
    'agentActivated',
    'availableProtocols',
  );

  test('protocols() returns array of Protocol objects', async () => {
    const protocols = await agent.protocols();

    expect(Array.isArray(protocols)).toBe(true);
    for (const p of protocols) {
      expect(typeof p.name).toBe('string');
      expect(typeof p.is_active).toBe('boolean');
    }
  });

  testWithProtocols(
    'updateProtocols() round-trips successfully',
    async () => {
      const protocols = getState().availableProtocols!;

      await expect(
        agent.updateProtocols(protocols),
      ).resolves.toBeUndefined();

      const readBack = await agent.protocols();
      const activeNames = readBack
        .filter((p) => p.is_active)
        .map((p) => p.name);

      for (const name of protocols) {
        expect(activeNames).toContain(name);
      }
    },
  );

  // Client-side validation — only needs walletAddress
  ifState('walletAddress')(
    'updateProtocols([]) throws ValidationError',
    async () => {
      await expect(agent.updateProtocols([])).rejects.toThrow(
        ValidationError,
      );
    },
  );

  test('constraints() returns array', async () => {
    const constraints = await agent.constraints();

    expect(Array.isArray(constraints)).toBe(true);
  });

  test(
    'updateConstraints() round-trips successfully',
    async () => {
      const current = await agent.constraints();

      await expect(
        agent.updateConstraints(current),
      ).resolves.toBeUndefined();
    },
  );

  test('whitelist() returns without error', async () => {
    await expect(agent.whitelist()).resolves.toBeDefined();
  });
});
