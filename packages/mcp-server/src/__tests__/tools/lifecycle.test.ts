import { lifecycleTools } from '../../tools/lifecycle.js';
import { WalletContextStore } from '../../context.js';
import { WalletNotConnectedError } from '../../errors.js';
import type { Address } from '@gizatech/agent-sdk';
import type { ToolContext } from '../../types.js';

const WALLET = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;

function makeCtx(
  agentMock: Record<string, unknown>,
  connected = true,
): ToolContext {
  const store = new WalletContextStore();
  if (connected) store.set('test-session', WALLET);
  return {
    giza: { agent: jest.fn().mockReturnValue(agentMock) } as never,
    walletStore: store,
    sessionId: 'test-session',
  };
}

describe('lifecycleTools', () => {
  const activate = lifecycleTools.find((t) => t.name === 'activate_agent')!;
  const deactivate = lifecycleTools.find(
    (t) => t.name === 'deactivate_agent',
  )!;
  const topUp = lifecycleTools.find((t) => t.name === 'top_up')!;
  const run = lifecycleTools.find((t) => t.name === 'run_agent')!;

  it('activate_agent calls agent.activate()', async () => {
    const agent = {
      activate: jest
        .fn()
        .mockResolvedValue({ message: 'ok', wallet: WALLET }),
    };
    const ctx = makeCtx(agent);
    const input = {
      owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      token: '0xcccccccccccccccccccccccccccccccccccccccc',
      protocols: ['aave'],
      txHash: '0xabc',
    };
    const result = await activate.handler(ctx, input);
    expect(agent.activate).toHaveBeenCalled();
    expect(result.isError).toBeUndefined();
  });

  it('activate_agent throws without connected wallet', async () => {
    const ctx = makeCtx({}, false);
    await expect(
      activate.handler(ctx, {
        owner: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        token: '0xcccccccccccccccccccccccccccccccccccccccc',
        protocols: ['aave'],
        txHash: '0xabc',
      }),
    ).rejects.toThrow(WalletNotConnectedError);
  });

  it('deactivate_agent calls agent.deactivate()', async () => {
    const agent = {
      deactivate: jest.fn().mockResolvedValue({ message: 'deactivated' }),
    };
    const ctx = makeCtx(agent);
    const result = await deactivate.handler(ctx, { transfer: true });
    expect(agent.deactivate).toHaveBeenCalledWith({ transfer: true });
    expect(result.content[0]!.text).toBe('deactivated');
  });

  it('top_up calls agent.topUp()', async () => {
    const agent = {
      topUp: jest.fn().mockResolvedValue({ message: 'topped up' }),
    };
    const ctx = makeCtx(agent);
    const result = await topUp.handler(ctx, { txHash: '0xdef' });
    expect(agent.topUp).toHaveBeenCalledWith('0xdef');
    expect(result.content[0]!.text).toBe('topped up');
  });

  it('run_agent calls agent.run()', async () => {
    const agent = {
      run: jest.fn().mockResolvedValue({ status: 'running' }),
    };
    const ctx = makeCtx(agent);
    const result = await run.handler(ctx, {});
    expect(agent.run).toHaveBeenCalled();
    expect(JSON.parse(result.content[0]!.text)).toEqual({ status: 'running' });
  });
});
