import { walletTools } from '../../tools/wallet.js';
import { WalletContextStore } from '../../context.js';
import type { Giza, Address } from '@gizatech/agent-sdk';
import type { ToolContext } from '../../types.js';

function makeCtx(store?: WalletContextStore): ToolContext {
  return {
    giza: {} as Giza,
    walletStore: store ?? new WalletContextStore(),
    sessionId: 'test-session',
  };
}

describe('walletTools', () => {
  const connectWallet = walletTools.find((t) => t.name === 'connect_wallet')!;
  const disconnectWallet = walletTools.find(
    (t) => t.name === 'disconnect_wallet',
  )!;

  describe('connect_wallet', () => {
    it('stores the wallet in context', async () => {
      const store = new WalletContextStore();
      const ctx = makeCtx(store);
      const wallet = '0x1234567890abcdef1234567890abcdef12345678';

      const result = await connectWallet.handler(ctx, { wallet });

      expect(result.isError).toBeUndefined();
      expect(result.content[0]!.text).toContain('connected');
      expect(store.get('test-session')).toBe(wallet);
    });
  });

  describe('disconnect_wallet', () => {
    it('removes the wallet from context', async () => {
      const store = new WalletContextStore();
      store.set(
        'test-session',
        '0x1234567890abcdef1234567890abcdef12345678' as Address,
      );
      const ctx = makeCtx(store);

      const result = await disconnectWallet.handler(ctx, {});

      expect(result.content[0]!.text).toContain('disconnected');
      expect(store.has('test-session')).toBe(false);
    });

    it('handles disconnect when no wallet is set', async () => {
      const ctx = makeCtx();
      const result = await disconnectWallet.handler(ctx, {});
      expect(result.content[0]!.text).toContain('No wallet');
    });
  });
});
