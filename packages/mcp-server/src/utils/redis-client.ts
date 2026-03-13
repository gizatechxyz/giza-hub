import { createClient, type RedisClientType } from 'redis';
import { ENV_REDIS_URL } from '../constants';

let clientPromise: Promise<RedisClientType | null> | null = null;
let warned = false;

export function getRedisClient(): Promise<RedisClientType | null> {
  if (clientPromise) return clientPromise;

  const url = process.env[ENV_REDIS_URL];
  if (!url) {
    if (!warned) {
      console.warn(
        '[giza-mcp] REDIS_URL not set — using in-memory store. Auth state will not survive across serverless invocations.',
      );
      warned = true;
    }
    clientPromise = Promise.resolve(null);
    return clientPromise;
  }

  clientPromise = createClient({ url })
    .on('error', (err: Error) => {
      console.error('[giza-mcp] Redis client error:', err.message);
    })
    .connect()
    .then((client) => client as RedisClientType)
    .catch((err: Error) => {
      clientPromise = null;
      throw err;
    });

  return clientPromise;
}

export function resetRedisClient(): void {
  clientPromise = null;
  warned = false;
}
