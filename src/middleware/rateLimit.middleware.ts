import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis";
import { sendError } from "../lib/response";

function buildLimiter(windowMs: number, max: number, message: string, prefix: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Falls back to express-rate-limit's built-in in-memory store when Redis
    // is not configured, so local development works without Redis running.
    store: redis
      ? new RedisStore({
          // @ts-expect-error ioredis call signature is compatible with the store's expectations
          sendCommand: (...args: string[]) => redis.call(...args),
          prefix: `rl:${prefix}:`,
        })
      : undefined,
    // If REDIS_URL is *configured* but the instance is unreachable/down at
    // request time (DNS failure, network partition, wrong host, etc.),
    // ioredis will reject the RedisStore's commands. Rather than let that
    // rejection crash the request with a 500, skip rate limiting for the
    // duration of the outage — availability wins over strict limiting.
    // (When REDIS_URL is unset entirely, `store` above is already undefined
    // and express-rate-limit's built-in in-memory store handles it fine.)
    skip: () => !!redis && redis.status !== "ready" && redis.status !== "connecting",
    handler: (_req, res) => {
      sendError(res, message, 429);
    },
  });
}

// Tight limits on authentication endpoints to slow down credential stuffing.
export const authRateLimiter = buildLimiter(
  15 * 60 * 1000,
  20,
  "Too many authentication attempts. Please try again later.",
  "auth",
);

// General API limiter.
export const apiRateLimiter = buildLimiter(
  15 * 60 * 1000,
  600,
  "Too many requests. Please slow down.",
  "api",
);

// Stricter limiter for payment initiation to prevent abuse.
export const paymentRateLimiter = buildLimiter(
  60 * 60 * 1000,
  30,
  "Too many payment requests. Please try again later.",
  "payment",
);