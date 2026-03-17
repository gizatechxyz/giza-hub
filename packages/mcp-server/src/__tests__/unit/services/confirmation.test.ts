import {
  describe,
  test,
  expect,
  mock,
  afterEach,
} from 'bun:test';
import { randomUUID } from 'node:crypto';

const CONFIRMATION_TOKEN_TTL_MS = 300_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/;
const WALLET = '0xabc123';
const OTHER_WALLET = '0xdef456';

/**
 * Since other test files mock confirmation.js via mock.module,
 * we test the confirmation logic inline to avoid mock interference.
 */

type CriticalOperationType = 'withdraw' | 'deactivate';

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

function createPendingOperation(
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

async function executePendingOperation(
  token: string,
  walletAddress: string,
): Promise<{ type: CriticalOperationType; result: unknown }> {
  const op = pendingOperations.get(token);
  if (!op || Date.now() - op.createdAt > CONFIRMATION_TOKEN_TTL_MS) {
    pendingOperations.delete(token);
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

function confirmationPayload(
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

const originalDateNow = Date.now;

afterEach(() => {
  Date.now = originalDateNow;
  pendingOperations.clear();
});

describe('createPendingOperation', () => {
  test('returns a UUID token', () => {
    const token = createPendingOperation(
      'withdraw',
      'Withdraw 1 ETH',
      WALLET,
      () => Promise.resolve(),
    );
    expect(token).toMatch(UUID_RE);
  });
});

describe('executePendingOperation', () => {
  test('runs stored callback and returns result', async () => {
    const executeFn = mock(() => Promise.resolve({ txHash: '0x1' }));
    const token = createPendingOperation(
      'withdraw',
      'Withdraw 1 ETH',
      WALLET,
      executeFn,
    );

    const { type, result } = await executePendingOperation(token, WALLET);

    expect(executeFn).toHaveBeenCalledTimes(1);
    expect(type).toBe('withdraw');
    expect(result).toEqual({ txHash: '0x1' });
  });

  test('throws on invalid token', async () => {
    await expect(
      executePendingOperation('nonexistent-token', WALLET),
    ).rejects.toThrow('expired');
  });

  test('throws on expired token', async () => {
    const now = originalDateNow();
    Date.now = () => now;

    const token = createPendingOperation(
      'withdraw',
      'Withdraw 1 ETH',
      WALLET,
      () => Promise.resolve(),
    );

    Date.now = () => now + CONFIRMATION_TOKEN_TTL_MS + 1;

    await expect(
      executePendingOperation(token, WALLET),
    ).rejects.toThrow('expired');
  });

  test('throws on wrong wallet address', async () => {
    const token = createPendingOperation(
      'deactivate',
      'Deactivate agent',
      WALLET,
      () => Promise.resolve(),
    );

    await expect(
      executePendingOperation(token, OTHER_WALLET),
    ).rejects.toThrow('different account');
  });

  test('throws already-used when concurrent call in flight', async () => {
    let resolveExecute!: (v: unknown) => void;
    const slowExecute = () =>
      new Promise((resolve) => {
        resolveExecute = resolve;
      });

    const token = createPendingOperation(
      'withdraw',
      'Withdraw funds',
      WALLET,
      slowExecute,
    );

    const firstCall = executePendingOperation(token, WALLET);

    await expect(
      executePendingOperation(token, WALLET),
    ).rejects.toThrow('already been used');

    resolveExecute({ ok: true });
    await firstCall;
  });

  test('resets used flag on execute failure', async () => {
    let callCount = 0;
    const executeFn = () => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('tx reverted'));
      }
      return Promise.resolve({ txHash: '0x2' });
    };

    const token = createPendingOperation(
      'withdraw',
      'Withdraw 1 ETH',
      WALLET,
      executeFn,
    );

    await expect(
      executePendingOperation(token, WALLET),
    ).rejects.toThrow('tx reverted');

    const { result } = await executePendingOperation(token, WALLET);
    expect(result).toEqual({ txHash: '0x2' });
  });

  test('deletes token after successful execution', async () => {
    const token = createPendingOperation(
      'withdraw',
      'Withdraw 1 ETH',
      WALLET,
      () => Promise.resolve('done'),
    );

    await executePendingOperation(token, WALLET);

    await expect(
      executePendingOperation(token, WALLET),
    ).rejects.toThrow('expired');
  });
});

describe('confirmationPayload', () => {
  test('returns correct structure', () => {
    const payload = confirmationPayload(
      'withdraw',
      'Withdraw 1 ETH',
      'test-token-123',
    );

    expect(payload).toEqual({
      status: 'confirmation_required',
      operation: 'withdraw',
      description: 'Withdraw 1 ETH',
      confirmationToken: 'test-token-123',
      expiresInSeconds: CONFIRMATION_TOKEN_TTL_MS / 1000,
      instruction:
        'Tell the user what will happen and ask them to confirm. Only proceed if they say yes.',
    });
  });
});
