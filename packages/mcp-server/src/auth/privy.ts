import type { Address } from '@gizatech/agent-sdk';
import { PrivyClient, type User } from '@privy-io/node';
import { ENV_PRIVY_APP_ID, ENV_PRIVY_APP_SECRET } from '../constants.js';
import { parseWalletAddress } from './types.js';

let client: PrivyClient | undefined;

export function getPrivyClient(): PrivyClient {
  if (!client) {
    const appId = process.env[ENV_PRIVY_APP_ID];
    const appSecret = process.env[ENV_PRIVY_APP_SECRET];
    if (!appId || !appSecret) {
      throw new Error(
        `${ENV_PRIVY_APP_ID} and ${ENV_PRIVY_APP_SECRET} must be set`,
      );
    }
    client = new PrivyClient({ appId, appSecret });
  }
  return client;
}

interface PrivyVerification {
  privyUserId: string;
  walletAddress: Address;
}

export async function verifyPrivyToken(
  accessToken: string,
): Promise<PrivyVerification> {
  const privy = getPrivyClient();

  const claims = await privy.utils().auth().verifyAccessToken(accessToken);
  const user = await privy.users()._get(claims.user_id);

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
    privyUserId: claims.user_id,
    walletAddress: parseWalletAddress(wallet.address),
  };
}
