import { randomUUID } from 'node:crypto';
import { CONFIRMATION_TOKEN_TTL_MS } from '../constants.js';

export type CriticalOperationType =
  | 'withdraw'
  | 'deactivate'
  | 'claim_rewards';

interface PendingOperation {
  type: CriticalOperationType;
  description: string;
  walletAddress: string;
  createdAt: number;
  used: boolean;
  execute: () => Promise<unknown>;
}

const pendingOperations = new Map<string, PendingOperation>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [token, op] of pendingOperations) {
    if (now - op.createdAt > CONFIRMATION_TOKEN_TTL_MS) {
      pendingOperations.delete(token);
    }
  }
}

export function createPendingOperation(
  type: CriticalOperationType,
  description: string,
  walletAddress: string,
  execute: () => Promise<unknown>,
): string {
  sweepExpired();
  const token = randomUUID();
  pendingOperations.set(token, {
    type,
    description,
    walletAddress,
    createdAt: Date.now(),
    used: false,
    execute,
  });
  return token;
}

export async function executePendingOperation(
  token: string,
  walletAddress: string,
): Promise<{ type: CriticalOperationType; result: unknown }> {
  const op = pendingOperations.get(token);

  if (!op || Date.now() - op.createdAt > CONFIRMATION_TOKEN_TTL_MS) {
    pendingOperations.delete(token);
    throw new Error(
      'Confirmation token not found or expired. Please initiate the operation again.',
    );
  }

  if (op.used) {
    throw new Error(
      'This confirmation token has already been used. Each token is single-use.',
    );
  }

  if (op.walletAddress !== walletAddress) {
    throw new Error(
      'This confirmation token is bound to a different wallet address.',
    );
  }

  op.used = true;
  try {
    const result = await op.execute();
    pendingOperations.delete(token);
    return { type: op.type, result };
  } catch (error) {
    op.used = false;
    throw error;
  }
}

export function confirmationPayload(
  type: CriticalOperationType,
  description: string,
  token: string,
): Record<string, unknown> {
  return {
    status: 'confirmation_required',
    operation: type,
    description,
    confirmationToken: token,
    expiresInSeconds: CONFIRMATION_TOKEN_TTL_MS / 1000,
    instruction:
      'Call giza_confirm_operation with the confirmationToken to execute this operation.',
  };
}
