export interface Session {
  walletAddress: string;
  chainId: number;
  createdAt: number;
}

export interface RateLimitEntry {
  timestamps: number[];
}

export interface PendingChallenge {
  walletAddress: string;
  message: string;
  expiresAt: number;
}
