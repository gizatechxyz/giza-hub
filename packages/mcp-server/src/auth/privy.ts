import type { Address } from '@gizatech/agent-sdk';
import { PrivyClient, type User } from '@privy-io/node';
import { ENV_PRIVY_APP_ID } from '../constants';
import { parseWalletAddress } from './types';

let client: PrivyClient | undefined;

export function getPrivyClient(): PrivyClient {
  if (!client) {
    const appId = process.env[ENV_PRIVY_APP_ID];
    if (!appId) {
      throw new Error(
        'Privy app ID not configured. Check environment configuration.',
      );
    }
    // appSecret is required by the type but unused for identity token
    // verification via users().get({ id_token }), which uses JWKS.
    client = new PrivyClient({ appId, appSecret: '' });
  }
  return client;
}

interface PrivyVerification {
  privyUserId: string;
  walletAddress: Address;
}

export async function verifyPrivyToken(
  identityToken: string,
): Promise<PrivyVerification> {
  const privy = getPrivyClient();

  const user = await privy.users().get({ id_token: identityToken });

  const wallet = user.linked_accounts.find(
    (account: User['linked_accounts'][number]) =>
      account.type === 'wallet' &&
      'chain_type' in account &&
      account.chain_type === 'ethereum',
  );
  if (!wallet || !('address' in wallet)) {
    throw new Error('No Ethereum wallet linked to this Privy account');
  }

  return {
    privyUserId: user.id,
    walletAddress: parseWalletAddress(wallet.address),
  };
}
