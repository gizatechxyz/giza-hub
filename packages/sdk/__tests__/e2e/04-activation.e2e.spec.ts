import { Giza } from '../../src';
import { getState, setState } from './helpers/state';
import { ifState } from './helpers/skip';

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

describe('04 — Activation', () => {
  let giza: Giza;

  beforeAll(() => {
    const state = getState();
    giza = new Giza({ chain: state.chain });
  });

  const txHash = process.env.E2E_TX_HASH;
  const canActivate = txHash && TX_HASH_RE.test(txHash);

  const test = canActivate
    ? ifState('walletAddress', 'eoa', 'token')
    : it.skip;

  test('activate() succeeds after deposit tx', async () => {
    const state = getState();
    const agent = giza.agent(state.walletAddress!);

    setState({ txHash: txHash! });

    if (!state.availableProtocols?.length) {
      const protocolsRes = await giza.protocols(state.token);
      setState({ availableProtocols: protocolsRes.protocols });
    }

    const protocols = getState().availableProtocols!;

    const res = await agent.activate({
      owner: state.eoa,
      token: state.token,
      protocols,
      txHash: txHash!,
    });

    expect(typeof res.message).toBe('string');
    expect(typeof res.wallet).toBe('string');

    setState({ agentActivated: true });
  });
});
