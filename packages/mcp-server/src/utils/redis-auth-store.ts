import { getRedisClient } from './redis-client';
import { BoundedMap } from './bounded-map';

export class RedisAuthStore<V> {
  private readonly prefix: string;
  private readonly ttlSeconds: number;
  private readonly fallback: BoundedMap<string, V>;

  constructor(prefix: string, ttlSeconds: number, fallbackMaxSize: number) {
    this.prefix = prefix;
    this.ttlSeconds = ttlSeconds;
    this.fallback = new BoundedMap<string, V>(fallbackMaxSize, ttlSeconds * 1000);
  }

  private key(id: string): string {
    return `${this.prefix}${id}`;
  }

  async set(id: string, value: V): Promise<void> {
    const client = await getRedisClient();
    if (!client) {
      this.fallback.set(id, value);
      return;
    }
    await client.set(this.key(id), JSON.stringify(value), {
      EX: this.ttlSeconds,
    });
  }

  async get(id: string): Promise<V | undefined> {
    const client = await getRedisClient();
    if (!client) {
      return this.fallback.get(id);
    }
    const raw = await client.get(this.key(id));
    if (raw === null) return undefined;
    return JSON.parse(raw) as V;
  }

  async has(id: string): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) {
      return this.fallback.has(id);
    }
    const exists = await client.exists(this.key(id));
    return exists === 1;
  }

  async delete(id: string): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) {
      return this.fallback.delete(id);
    }
    const count = await client.del(this.key(id));
    return count === 1;
  }
}
