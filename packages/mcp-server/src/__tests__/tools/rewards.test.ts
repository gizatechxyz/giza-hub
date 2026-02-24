import { rewardsTools } from '../../tools/rewards.js';
import { WalletContextStore } from '../../context.js';
import type { Address } from '@gizatech/agent-sdk';
import type { ToolContext } from '../../types.js';

const WALLET = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;

function makeCtx(agentMock: Record<string, unknown>): ToolContext {
  const store = new WalletContextStore();
  store.set('test-session', WALLET);
  return {
    giza: { agent: jest.fn().mockReturnValue(agentMock) } as never,
    walletStore: store,
    sessionId: 'test-session',
  };
}

describe('rewardsTools', () => {
  const claimRewards = rewardsTools.find((t) => t.name === 'claim_rewards')!;

  it('calls agent.claimRewards()', async () => {
    const rewards = {
      rewards: [{ token: 'GZA', amount: 100, amount_float: 100 }],
    };
    const agent = { claimRewards: jest.fn().mockResolvedValue(rewards) };
    const result = await claimRewards.handler(makeCtx(agent), {});
    expect(agent.claimRewards).toHaveBeenCalled();
    expect(JSON.parse(result.content[0]!.text)).toEqual(rewards);
  });
});
