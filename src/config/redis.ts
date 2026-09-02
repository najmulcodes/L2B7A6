import Redis from "ioredis";
import { env } from "./env";

/**
 * Redis is used for:
 *  1. Rate limiting (express-rate-limit + rate-limit-redis store)
 *  2. Caching published-assessment / problem-bank list reads
 *  3. Short-lived distributed locks (attempt submission, credit spend)
 *
 * The app must keep working locally when Redis is not configured/reachable —
 * every consumer below degrades to a no-op / in-memory fallback rather than
 * crashing the process.
 */

let client: Redis | null = null;
let hasLoggedFailure = false;

if (env.REDIS_URL) {
  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  });

  client.on("error", (err) => {
    if (!hasLoggedFailure) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Redis unavailable, continuing without cache/rate-limit backing store: ${err.message}`);
      hasLoggedFailure = true;
    }
  });

  client.connect().catch(() => {
    /* handled by the 'error' listener above */
  });
}

export const redis = client;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || redis.status !== "ready") return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* cache is best-effort */
  }
}

export async function cacheDelByPrefix(prefix: string): Promise<void> {
  if (!redis || redis.status !== "ready") return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
    /* cache is best-effort */
  }
}

/**
 * Simple distributed lock using SET NX PX. Returns a release function, or
 * null if the lock could not be acquired (or Redis is unavailable, in which
 * case we allow the caller to proceed — the DB transaction remains the
 * source of truth for correctness).
 */
export async function acquireLock(key: string, ttlMs = 5000): Promise<(() => Promise<void>) | null> {
  if (!redis || redis.status !== "ready") return async () => {};
  const token = `${Date.now()}-${Math.random()}`;
  const ok = await redis.set(key, token, "PX", ttlMs, "NX");
  if (ok !== "OK") return null;
  return async () => {
    try {
      const val = await redis.get(key);
      if (val === token) await redis.del(key);
    } catch {
      /* best-effort unlock; TTL will expire it regardless */
    }
  };
}
