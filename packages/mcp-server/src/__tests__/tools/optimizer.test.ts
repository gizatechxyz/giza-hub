import { optimizerTools } from '../../tools/optimizer.js';
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

describe('optimizerTools', () => {
  const optimizeTool = optimizerTools.find((t) => t.name === 'optimize')!;

  it('optimize calls giza.optimize()', async () => {
    const response = {
      optimization_result: { allocations: [], apr_improvement: 1.5 },
      action_plan: [],
      calldata: [],
    };
    const giza = { optimize: jest.fn().mockResolvedValue(response) };
    const result = await optimizeTool.handler(makeCtx(giza), {
      token: TOKEN,
      capital: '1000000',
      currentAllocations: { aave: '500000' },
      protocols: ['aave', 'compound'],
    });
    expect(giza.optimize).toHaveBeenCalledWith({
      token: TOKEN,
      capital: '1000000',
      currentAllocations: { aave: '500000' },
      protocols: ['aave', 'compound'],
      constraints: undefined,
      wallet: undefined,
    });
    expect(result.isError).toBeUndefined();
  });
});
