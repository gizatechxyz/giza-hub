export class BoundedMap<K, V> {
  private map = new Map<K, { value: V; createdAt: number }>();
  private readonly maxSize: number;
  private readonly ttlMs: number | undefined;

  constructor(maxSize: number, ttlMs?: number) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  private sweepExpired(): void {
    if (!this.ttlMs) return;
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (now - entry.createdAt > this.ttlMs) {
        this.map.delete(key);
      }
    }
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.set(key, { value, createdAt: Date.now() });
      return;
    }
    this.sweepExpired();
    if (this.map.size >= this.maxSize) {
      throw new Error('Storage capacity exceeded');
    }
    this.map.set(key, { value, createdAt: Date.now() });
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs && Date.now() - entry.createdAt > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
