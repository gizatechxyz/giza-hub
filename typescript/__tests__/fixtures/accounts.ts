import { Chain } from '../../src/types/common';
import { SmartAccountInfo, ZerodevSmartWalletResponse } from '../../src/types/smart-account';
import { VALID_ADDRESSES } from './addresses';

export const MOCK_SMART_ACCOUNT_RESPONSE_1: ZerodevSmartWalletResponse = {
  smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
  backendWallet: VALID_ADDRESSES.BACKEND_WALLET_1,
};

export const MOCK_SMART_ACCOUNT_RESPONSE_2: ZerodevSmartWalletResponse = {
  smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_2,
  backendWallet: VALID_ADDRESSES.BACKEND_WALLET_2,
};

export const MOCK_SMART_ACCOUNT_INFO_BASE: SmartAccountInfo = {
  smartAccountAddress: VALID_ADDRESSES.SMART_ACCOUNT_1,
  backendWallet: VALID_ADDRESSES.BACKEND_WALLET_1,
  origin_wallet: VALID_ADDRESSES.EOA_1,
  chain: Chain.BASE,
};

export const MOCK_SMART_ACCOUNT_INFO_ARBITRUM: SmartAccountInfo = {
  smartAccountAddress: VALID_ADDRESSES.SMART_ACCOUNT_2,
  backendWallet: VALID_ADDRESSES.BACKEND_WALLET_2,
  origin_wallet: VALID_ADDRESSES.EOA_2,
  chain: Chain.ARBITRUM,
};

