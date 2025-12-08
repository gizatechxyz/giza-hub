import { Address } from '../../src/types/common';

export interface TestContext {
  /**
   * Smart account address created in the first test suite
   */
  smartAccountAddress: Address | null;

  /**
   * Backend wallet address associated with the smart account
   */
  backendWallet: Address | null;

  /**
   * Origin wallet (EOA) used for testing
   */
  originWallet: Address | null;

  /**
   * Available protocols for USDC on Base chain
   */
  protocols: string[];

  /**
   * Whether the agent has been activated
   */
  isActivated: boolean;

  /**
   * Transaction hash of the deposit (for activation)
   */
  depositTxHash: string | null;
}

/**
 * Global test context singleton
 */
class SharedContext {
  private static instance: SharedContext;
  private context: TestContext;

  private constructor() {
    this.context = {
      smartAccountAddress: null,
      backendWallet: null,
      originWallet: null,
      protocols: [],
      isActivated: false,
      depositTxHash: null,
    };
  }

  public static getInstance(): SharedContext {
    if (!SharedContext.instance) {
      SharedContext.instance = new SharedContext();
    }
    return SharedContext.instance;
  }

  /**
   * Get the current test context
   */
  public get(): TestContext {
    return this.context;
  }

  /**
   * Update the test context with partial data
   */
  public update(data: Partial<TestContext>): void {
    this.context = { ...this.context, ...data };
  }

  /**
   * Set smart account data
   */
  public setSmartAccount(address: Address, backendWallet: Address): void {
    this.context.smartAccountAddress = address;
    this.context.backendWallet = backendWallet;
  }

  /**
   * Set origin wallet (EOA)
   */
  public setOriginWallet(address: Address): void {
    this.context.originWallet = address;
  }

  /**
   * Set available protocols
   */
  public setProtocols(protocols: string[]): void {
    this.context.protocols = protocols;
  }

  /**
   * Mark agent as activated
   */
  public setActivated(isActivated: boolean): void {
    this.context.isActivated = isActivated;
  }

  /**
   * Set deposit transaction hash
   */
  public setDepositTxHash(txHash: string): void {
    this.context.depositTxHash = txHash;
  }

  /**
   * Reset the context (useful for cleanup)
   */
  public reset(): void {
    this.context = {
      smartAccountAddress: null,
      backendWallet: null,
      originWallet: null,
      protocols: [],
      isActivated: false,
      depositTxHash: null,
    };
  }

  /**
   * Check if smart account exists
   */
  public hasSmartAccount(): boolean {
    return this.context.smartAccountAddress !== null;
  }

  /**
   * Check if protocols have been fetched
   */
  public hasProtocols(): boolean {
    return this.context.protocols.length > 0;
  }

  /**
   * Get smart account address (throws if not set)
   */
  public requireSmartAccount(): Address {
    if (!this.context.smartAccountAddress) {
      throw new Error(
        'Smart account not set. Make sure 01-smart-account tests ran first.'
      );
    }
    return this.context.smartAccountAddress;
  }

  /**
   * Get protocols (throws if not set)
   */
  public requireProtocols(): string[] {
    if (this.context.protocols.length === 0) {
      throw new Error(
        'Protocols not set. Make sure 02-protocols tests ran first.'
      );
    }
    return this.context.protocols;
  }

  /**
   * Require agent to be activated
   */
  public requireActivated(): void {
    if (!this.context.isActivated) {
      throw new Error(
        'Agent not activated. Make sure 03-activation tests ran first.'
      );
    }
  }
}

// Export singleton instance
export const sharedContext = SharedContext.getInstance();

