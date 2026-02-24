import { Giza, ValidationError } from '../../src';
import { Address } from '../../src/types/common';
import { getState } from './helpers/state';
import { ifState } from './helpers/skip';

describe('09 — Optimizer', () => {
  let giza: Giza;
  let token: Address;

  beforeAll(() => {
    const state = getState();
    giza = new Giza({ chain: state.chain });
    token = state.token;
  });

  const testWithProtocols = ifState('availableProtocols');

  // -----------------------------------------------------------
  // optimize()
  // -----------------------------------------------------------

  testWithProtocols(
    'optimize() returns allocations, apr, action_plan, calldata',
    async () => {
      const protocols = getState().availableProtocols!;
      const allocations: Record<string, string> = {};
      for (const p of protocols) {
        allocations[p] = '0';
      }

      const res = await giza.optimize({
        token,
        capital: '1000000',
        currentAllocations: allocations,
        protocols,
      });

      expect(
        Array.isArray(res.optimization_result.allocations),
      ).toBe(true);
      expect(
        typeof res.optimization_result.weighted_apr_final,
      ).toBe('number');
      expect(Array.isArray(res.action_plan)).toBe(true);
      expect(Array.isArray(res.calldata)).toBe(true);
    },
  );

  it('optimize() with empty protocols throws ValidationError', async () => {
    await expect(
      giza.optimize({
        token,
        capital: '1000000',
        currentAllocations: {},
        protocols: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('optimize() with invalid address throws ValidationError', async () => {
    await expect(
      giza.optimize({
        token: '0xinvalid' as Address,
        capital: '1000000',
        currentAllocations: {},
        protocols: ['some-protocol'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  testWithProtocols(
    'optimize() with zero capital throws ValidationError',
    async () => {
      const protocols = getState().availableProtocols!;

      await expect(
        giza.optimize({
          token,
          capital: '0',
          currentAllocations: {},
          protocols,
        }),
      ).rejects.toThrow(ValidationError);
    },
  );

});
