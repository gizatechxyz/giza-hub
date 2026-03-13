import { describe, test, expect, mock, beforeEach } from 'bun:test';

let mockClient: Record<string, ReturnType<typeof mock>> | null = null;

mock.module('../../../utils/redis-client.js', () => ({
  getRedisClient: () => Promise.resolve(mockClient),
}));

const { RedisAuthStore } = await import('../../../utils/redis-auth-store.js');

type TestValue = { name: string; count: number };

describe('RedisAuthStore', () => {
  describe('with Redis client', () => {
    let store: InstanceType<typeof RedisAuthStore<TestValue>>;
    const storage = new Map<string, string>();

    beforeEach(() => {
      storage.clear();
      mockClient = {
        set: mock((key: string, value: string, _opts: unknown) => {
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
      store = new RedisAuthStore<TestValue>('test:', 300, 100);
    });

    test('set stores value with prefix and TTL', async () => {
      await store.set('abc', { name: 'hello', count: 1 });

      expect(mockClient!.set).toHaveBeenCalledWith(
        'test:abc',
        JSON.stringify({ name: 'hello', count: 1 }),
        { EX: 300 },
      );
    });

    test('get returns parsed value', async () => {
      await store.set('abc', { name: 'hello', count: 42 });

      const result = await store.get('abc');
      expect(result).toEqual({ name: 'hello', count: 42 });
    });

    test('get returns undefined for missing key', async () => {
      const result = await store.get('missing');
      expect(result).toBeUndefined();
    });

    test('has returns true for existing key', async () => {
      await store.set('abc', { name: 'test', count: 0 });
      expect(await store.has('abc')).toBe(true);
    });

    test('has returns false for missing key', async () => {
      expect(await store.has('missing')).toBe(false);
    });

    test('delete removes key and returns true', async () => {
      await store.set('abc', { name: 'test', count: 0 });
      expect(await store.delete('abc')).toBe(true);
      expect(await store.get('abc')).toBeUndefined();
    });

    test('delete returns false for missing key', async () => {
      expect(await store.delete('missing')).toBe(false);
    });

    test('propagates Redis errors', async () => {
      mockClient!.get = mock(() =>
        Promise.reject(new Error('Connection refused')),
      );

      await expect(store.get('abc')).rejects.toThrow('Connection refused');
    });
  });

  describe('BoundedMap fallback (no Redis)', () => {
    let store: InstanceType<typeof RedisAuthStore<TestValue>>;

    beforeEach(() => {
      mockClient = null;
      store = new RedisAuthStore<TestValue>('test:', 300, 100);
    });

    test('set and get work with in-memory fallback', async () => {
      await store.set('abc', { name: 'fallback', count: 7 });
      const result = await store.get('abc');
      expect(result).toEqual({ name: 'fallback', count: 7 });
    });

    test('has works with fallback', async () => {
      await store.set('abc', { name: 'test', count: 0 });
      expect(await store.has('abc')).toBe(true);
      expect(await store.has('missing')).toBe(false);
    });

    test('delete works with fallback', async () => {
      await store.set('abc', { name: 'test', count: 0 });
      expect(await store.delete('abc')).toBe(true);
      expect(await store.get('abc')).toBeUndefined();
    });
  });
});
