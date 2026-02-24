import { portfolioTools } from '../../tools/portfolio.js';
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

describe('portfolioTools', () => {
  const getPortfolio = portfolioTools.find(
    (t) => t.name === 'get_portfolio',
  )!;
  const getPerformance = portfolioTools.find(
    (t) => t.name === 'get_performance',
  )!;
  const getApr = portfolioTools.find((t) => t.name === 'get_apr')!;
  const getDeposits = portfolioTools.find((t) => t.name === 'get_deposits')!;

  it('get_portfolio returns agent info', async () => {
    const info = { wallet: WALLET, status: 'activated' };
    const agent = { portfolio: jest.fn().mockResolvedValue(info) };
    const result = await getPortfolio.handler(makeCtx(agent), {});
    expect(JSON.parse(result.content[0]!.text)).toEqual(info);
  });

  it('get_performance passes from option', async () => {
    const data = { performance: [] };
    const agent = { performance: jest.fn().mockResolvedValue(data) };
    const result = await getPerformance.handler(makeCtx(agent), {
      from: '2024-01-01',
    });
    expect(agent.performance).toHaveBeenCalledWith({ from: '2024-01-01' });
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });

  it('get_apr passes date options', async () => {
    const data = { apr: 5.5 };
    const agent = { apr: jest.fn().mockResolvedValue(data) };
    const result = await getApr.handler(makeCtx(agent), {
      startDate: '2024-01-01',
    });
    expect(agent.apr).toHaveBeenCalledWith({
      startDate: '2024-01-01',
      endDate: undefined,
      useExactEndDate: undefined,
    });
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });

  it('get_deposits returns deposit list', async () => {
    const data = { deposits: [{ amount: 100, token_type: 'USDC' }] };
    const agent = { deposits: jest.fn().mockResolvedValue(data) };
    const result = await getDeposits.handler(makeCtx(agent), {});
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });
});
