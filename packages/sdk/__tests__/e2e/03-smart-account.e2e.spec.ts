import './setup.js';
import { Giza, Agent } from '../../src';
import { Address } from '../../src/types/common';
import { getState, setState } from './helpers/state';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

describe('03 — Smart account operations', () => {
  let giza: Giza;
  let eoa: Address;

  beforeAll(() => {
    const state = getState();
    giza = new Giza({ chain: state.chain });
    eoa = state.eoa;
  });

  it('createAgent(eoa) returns Agent with valid wallet', async () => {
    const agent = await giza.createAgent(eoa);

    expect(agent).toBeInstanceOf(Agent);
    expect(agent.wallet).toMatch(ADDRESS_RE);

    setState({ walletAddress: agent.wallet });
  });

  it('getAgent(eoa) returns agent with same wallet', async () => {
    const agent = await giza.getAgent(eoa);

    expect(agent).toBeInstanceOf(Agent);
    expect(agent.wallet).toBe(getState().walletAddress);
  });

  it('getSmartAccount(eoa) returns full SmartAccountInfo', async () => {
    const info = await giza.getSmartAccount(eoa);

    expect(info.smartAccountAddress).toMatch(ADDRESS_RE);
    expect(info.backendWallet).toMatch(ADDRESS_RE);
    expect(info.origin_wallet).toBe(eoa);
    expect(info.chain).toBe(getState().chain);

    setState({ backendWallet: info.backendWallet });
  });

  it('agent(wallet) returns Agent synchronously without HTTP call', () => {
    const state = getState();
    if (!state.walletAddress) {
      console.warn('[SKIP] walletAddress not set');
      return;
    }

    const agent = giza.agent(state.walletAddress);

    expect(agent).toBeInstanceOf(Agent);
    expect(agent.wallet).toBe(state.walletAddress);
  });
});
