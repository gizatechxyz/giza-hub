import { describe, test, expect, mock, beforeEach } from 'bun:test';

let mockClient: Record<string, ReturnType<typeof mock>> | null = null;

mock.module('../../../utils/redis-client.js', () => ({
  getRedisClient: () => Promise.resolve(mockClient),
}));

const { RedisClientsStore } = await import(
  '../../../auth/redis-clients-store.js'
);

describe('RedisClientsStore', () => {
  let store: InstanceType<typeof RedisClientsStore>;
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    mockClient = {
      set: mock((key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),
      get: mock((key: string) => {
        return Promise.resolve(storage.get(key) ?? null);
      }),
      exists: mock((key: string) => {
        return Promise.resolve(storage.has(key) ? 1 : 0);
      }),
      del: mock((key: string) => {
        const had = storage.has(key);
        storage.delete(key);
        return Promise.resolve(had ? 1 : 0);
      }),
    };
    store = new RedisClientsStore();
  });

  test('registerClient stores and returns client', async () => {
    const metadata = {
      client_id: crypto.randomUUID(),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: ['http://localhost/callback'],
    } as any;

    const result = await store.registerClient(metadata);

    expect(result.client_id).toBe(metadata.client_id);
    expect(result.client_id_issued_at).toBe(metadata.client_id_issued_at);
    expect(result.redirect_uris).toEqual(['http://localhost/callback']);
  });

  test('getClient returns registered client', async () => {
    const metadata = {
      client_id: 'test-id',
      redirect_uris: ['http://localhost/callback'],
    } as any;

    await store.registerClient(metadata);
    const retrieved = await store.getClient('test-id');

    expect(retrieved).toBeDefined();
    expect(retrieved!.client_id).toBe('test-id');
    expect(retrieved!.redirect_uris).toEqual(['http://localhost/callback']);
  });

  test('getClient returns undefined for unknown client', async () => {
    const result = await store.getClient('nonexistent');
    expect(result).toBeUndefined();
  });

  test('getClient retrieves by client_id', async () => {
    const metadata = {
      client_id: 'my-custom-id',
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: ['http://localhost/callback'],
    } as any;

    await store.registerClient(metadata);
    const retrieved = await store.getClient('my-custom-id');
    expect(retrieved).toBeDefined();
    expect(retrieved!.client_id).toBe('my-custom-id');
  });
});
