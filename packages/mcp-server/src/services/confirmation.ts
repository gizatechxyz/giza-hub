import { randomUUID } from 'node:crypto';
import { CONFIRMATION_TOKEN_TTL_MS, MAX_PENDING_OPERATIONS } from '../constants';
import { BoundedMap } from '../utils/bounded-map';

export type CriticalOperationType =
  | 'withdraw'
  | 'deactivate';

interface PendingOperation {
  type: CriticalOperationType;
  description: string;
  walletAddress: string;
  used: boolean;
  execute: () => Promise<unknown>;
}

const pendingOperations = new BoundedMap<string, PendingOperation>(MAX_PENDING_OPERATIONS, CONFIRMATION_TOKEN_TTL_MS);

export function createPendingOperation(
  type: CriticalOperationType,
  description: string,
  walletAddress: string,
  execute: () => Promise<unknown>,
): string {
  const token = randomUUID();
  pendingOperations.set(token, {
    type,
    description,
    walletAddress,
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

  if (!op) {
    throw new Error(
      'That confirmation has expired. Please start the operation again.',
    );
  }

  if (op.used) {
    throw new Error(
      'This confirmation token has already been used. Each token is single-use.',
    );
  }

  if (op.walletAddress !== walletAddress) {
    throw new Error(
      'This confirmation belongs to a different account.',
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
      'Tell the user what will happen and ask them to confirm. Only proceed if they say yes.',
  };
}
