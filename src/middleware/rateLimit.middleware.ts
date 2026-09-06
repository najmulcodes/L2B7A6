import rateLimit from "express-rate-limit";
import { redis } from "../config/redis";
import { sendError } from "../lib/response";

/**
 * A Redis-backed rate-limit store that can NEVER crash a request.
 *
 * We intentionally don't use `rate-limit-redis`'s RedisStore here: it
 * forwards command failures (connection drops, DNS failures, mid-flight
 * timeouts on a flaky/misconfigured Redis) straight up as a rejected
 * promise, which — before this fix — surfaced as a 500 to real users
 * whenever the configured Redis instance had any hiccup. Every method
 * below catches its own errors and fails OPEN (allows the request)
 * instead: availability wins over strict rate limiting when the backing
 * store is unhealthy. When Redis is fully healthy, this behaves like a
 * normal fixed-window counter using INCR/PEXPIRE.
 */
class ResilientRedisStore {
  windowMs = 0;
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs;
  }

  private key(key: string): string {
    return `rl:${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    if (!redis || redis.status !== "ready") {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
    try {
      const redisKey = this.key(key);
      const totalHits = await redis.incr(redisKey);
      if (totalHits === 1) {
        await redis.pexpire(redisKey, this.windowMs);
      }
      const ttl = await redis.pttl(redisKey);
      return { totalHits, resetTime: new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs)) };
    } catch {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    if (!redis || redis.status !== "ready") return;
    try {
      await redis.decr(this.key(key));
    } catch {
      /* best-effort */
    }
  }

  async resetKey(key: string): Promise<void> {
    if (!redis || redis.status !== "ready") return;
    try {
      await redis.del(this.key(key));
    } catch {
      /* best-effort */
    }
  }
}

function buildLimiter(windowMs: number, max: number, message: string, prefix: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: redis ? new ResilientRedisStore(prefix) : undefined,
    handler: (_req, res) => {
      sendError(res, message, 429);
    },
  });
}

export const authRateLimiter = buildLimiter(
  15 * 60 * 1000,
  20,
  "Too many authentication attempts. Please try again later.",
  "auth",
);

export const apiRateLimiter = buildLimiter(
  15 * 60 * 1000,
  600,
  "Too many requests. Please slow down.",
  "api",
);

export const paymentRateLimiter = buildLimiter(
  60 * 60 * 1000,
  30,
  "Too many payment requests. Please try again later.",
  "payment",
);
