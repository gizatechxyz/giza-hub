import { Address, Chain } from './common';

/**
 * Parameters for creating a new smart account
 */
export interface CreateSmartAccountParams {
  /**
   * EOA address
   * This is the user's wallet address
   */
  eoa: Address;
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
   * EOA address to query
   */
  eoa?: Address;
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
   * The EOA address that owns the smart account
   */
  eoa: Address;

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

