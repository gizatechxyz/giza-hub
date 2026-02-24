import { financialTools } from '../../tools/financial.js';
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

describe('financialTools', () => {
  const withdrawTool = financialTools.find((t) => t.name === 'withdraw')!;
  const getStatus = financialTools.find(
    (t) => t.name === 'get_withdrawal_status',
  )!;
  const getTx = financialTools.find((t) => t.name === 'get_transactions')!;
  const getFees = financialTools.find((t) => t.name === 'get_fees')!;

  it('withdraw calls agent.withdraw(amount)', async () => {
    const agent = {
      withdraw: jest.fn().mockResolvedValue({ message: 'ok' }),
    };
    const result = await withdrawTool.handler(makeCtx(agent), {
      amount: '1000',
    });
    expect(agent.withdraw).toHaveBeenCalledWith('1000');
    expect(result.isError).toBeUndefined();
  });

  it('withdraw without amount calls full withdrawal', async () => {
    const agent = {
      withdraw: jest.fn().mockResolvedValue({ message: 'full' }),
    };
    await withdrawTool.handler(makeCtx(agent), {});
    expect(agent.withdraw).toHaveBeenCalledWith(undefined);
  });

  it('get_withdrawal_status returns status', async () => {
    const status = { status: 'deactivated', wallet: WALLET };
    const agent = { status: jest.fn().mockResolvedValue(status) };
    const result = await getStatus.handler(makeCtx(agent), {});
    expect(JSON.parse(result.content[0]!.text)).toEqual(status);
  });

  it('get_transactions returns first page', async () => {
    const items = [{ action: 'deposit', amount: 100 }];
    const paginator = { first: jest.fn().mockResolvedValue(items) };
    const agent = { transactions: jest.fn().mockReturnValue(paginator) };
    const result = await getTx.handler(makeCtx(agent), { limit: 10 });
    expect(paginator.first).toHaveBeenCalledWith(10);
    expect(JSON.parse(result.content[0]!.text)).toEqual(items);
  });

  it('get_fees returns fee info', async () => {
    const fees = { percentage_fee: 0.1, fee: 5 };
    const agent = { fees: jest.fn().mockResolvedValue(fees) };
    const result = await getFees.handler(makeCtx(agent), {});
    expect(JSON.parse(result.content[0]!.text)).toEqual(fees);
  });
});
