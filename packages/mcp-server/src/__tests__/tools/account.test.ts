import { accountTools } from '../../tools/account.js';
import { WalletContextStore } from '../../context.js';
import type { ToolContext } from '../../types.js';

const SMART_WALLET = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
const EOA = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const;

function makeCtx(gizaMock: Record<string, unknown>): ToolContext {
  return {
    giza: gizaMock as never,
    walletStore: new WalletContextStore(),
    sessionId: 'test-session',
  };
}

describe('accountTools', () => {
  const createSmartAccount = accountTools.find(
    (t) => t.name === 'create_smart_account',
  )!;
  const getSmartAccount = accountTools.find(
    (t) => t.name === 'get_smart_account',
  )!;

  describe('create_smart_account', () => {
    it('calls giza.createAgent and connects wallet', async () => {
      const giza = {
        createAgent: jest.fn().mockResolvedValue({ wallet: SMART_WALLET }),
      };
      const ctx = makeCtx(giza);

      const result = await createSmartAccount.handler(ctx, { eoa: EOA });

      expect(giza.createAgent).toHaveBeenCalledWith(EOA);
      expect(result.isError).toBeUndefined();
      expect(ctx.walletStore.get('test-session')).toBe(SMART_WALLET);
    });
  });

  describe('get_smart_account', () => {
    it('calls giza.getSmartAccount and returns info', async () => {
      const info = {
        smartAccountAddress: SMART_WALLET,
        backendWallet: EOA,
        origin_wallet: EOA,
        chain: 8453,
      };
      const giza = { getSmartAccount: jest.fn().mockResolvedValue(info) };
      const ctx = makeCtx(giza);

      const result = await getSmartAccount.handler(ctx, { eoa: EOA });

      expect(giza.getSmartAccount).toHaveBeenCalledWith(EOA);
      expect(JSON.parse(result.content[0]!.text)).toEqual(info);
    });
  });
});
