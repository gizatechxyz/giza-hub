import { protocolTools } from '../../tools/protocol.js';
import { WalletContextStore } from '../../context.js';
import type { ToolContext } from '../../types.js';

const TOKEN = '0xcccccccccccccccccccccccccccccccccccccccc' as const;

function makeCtx(gizaMock: Record<string, unknown>): ToolContext {
  return {
    giza: gizaMock as never,
    walletStore: new WalletContextStore(),
    sessionId: 'test-session',
  };
}

describe('protocolTools', () => {
  const getProtocols = protocolTools.find((t) => t.name === 'get_protocols')!;
  const getTokens = protocolTools.find((t) => t.name === 'get_tokens')!;
  const getStats = protocolTools.find((t) => t.name === 'get_stats')!;
  const getTvl = protocolTools.find((t) => t.name === 'get_tvl')!;

  it('get_protocols calls giza.protocols(token)', async () => {
    const data = { protocols: ['aave', 'compound'] };
    const giza = { protocols: jest.fn().mockResolvedValue(data) };
    const result = await getProtocols.handler(makeCtx(giza), { token: TOKEN });
    expect(giza.protocols).toHaveBeenCalledWith(TOKEN);
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });

  it('get_tokens calls giza.tokens()', async () => {
    const data = { tokens: [] };
    const giza = { tokens: jest.fn().mockResolvedValue(data) };
    const result = await getTokens.handler(makeCtx(giza), {});
    expect(giza.tokens).toHaveBeenCalled();
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });

  it('get_stats calls giza.stats()', async () => {
    const data = { total_balance: 1000 };
    const giza = { stats: jest.fn().mockResolvedValue(data) };
    const result = await getStats.handler(makeCtx(giza), {});
    expect(giza.stats).toHaveBeenCalled();
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });

  it('get_tvl calls giza.tvl()', async () => {
    const data = { tvl: 5000000 };
    const giza = { tvl: jest.fn().mockResolvedValue(data) };
    const result = await getTvl.handler(makeCtx(giza), {});
    expect(giza.tvl).toHaveBeenCalled();
    expect(JSON.parse(result.content[0]!.text)).toEqual(data);
  });
});
