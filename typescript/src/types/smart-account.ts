import { Address, Chain } from './common';

/**
 * Parameters for creating a new smart account
 */
export interface CreateSmartAccountParams {
  /**
   * Origin wallet address
   * This is the user's wallet address
   */
  origin_wallet: Address;
}

/**
 * Parameters for retrieving smart account information
 */
export interface GetSmartAccountParams {
  /**
   * Smart account address to query
   */
  smartAccount?: Address;

  /**
   * Origin wallet address to query
   */
  origin_wallet?: Address;
}

/**
 * Parameters for updating smart account permissions
 */
export interface UpdatePermissionsParams {
  /**
   * Smart account address to update
   */
  smartAccount: Address;

  /**
   * Placeholder for future permission parameters
   */
  // TODO: Implement permission updates
}

/**
 * Smart account information returned from API
 */
export interface SmartAccountInfo {
  /**
   * The smart account address (contract wallet)
   */
  smartAccountAddress: Address;

  /**
   * The backend wallet address that manages the smart account
   */
  backendWallet: Address;

  /**
   * The origin wallet address that owns the smart account
   */
  origin_wallet: Address;

  /**
   * The blockchain network the smart account is on
   */
  chain: Chain;
}

/**
 * Raw response from the backend API for smart account creation
 */
export interface ZerodevSmartWalletResponse {
  smartAccount: string;
  backendWallet: string;
}

