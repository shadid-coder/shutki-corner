/**
 * Rate limiter with two backends behind the same async interface:
 *
 *  - In-memory fixed window (default, used automatically whenever
 *    Upstash env vars are absent) — fine for local development and
 *    single-instance testing, but each server process has its own Map,
 *    so it does NOT enforce a shared limit across multiple instances.
 *  - Upstash Redis (REST API, no persistent TCP connection needed —
 *    works from serverless/edge runtimes) — used automatically when
 *    `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 *    This is the one that actually enforces a shared limit across
 *    multiple server instances in production.
 *
 * Required environment variables for the production backend:
 *   UPSTASH_REDIS_REST_URL    — from the Upstash console (Redis > REST API)
 *   UPSTASH_REDIS_REST_TOKEN  — from the same page
 *
 * Every call site in this codebase already does `await rateLimit(...)`,
 * so switching backends requires no changes outside this file.
 */
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

// --- In-memory fallback (development / no Redis configured) ---

type Bucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, Bucket>();

function memoryRateLimit(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

// --- Upstash Redis backend ---

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

async function redisRateLimit(redis: Redis, key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  // INCR is atomic in Redis — concurrent requests across any number of
  // server instances still serialize through this single counter, which
  // is exactly the property the in-memory Map cannot provide.
  const count = await redis.incr(redisKey);
  if (count === 1) {
    // Only the request that just created the key sets its expiry, so we
    // don't repeatedly push the window back out on every hit.
    await redis.expire(redisKey, windowSeconds);
  }

  if (count > maxAttempts) {
    const ttlSeconds = await redis.ttl(redisKey);
    return { allowed: false, retryAfterMs: Math.max(ttlSeconds, 0) * 1000 };
  }

  return { allowed: true };
}

export async function rateLimit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (redis) {
    try {
      return await redisRateLimit(redis, key, maxAttempts, windowMs);
    } catch (err) {
      // A Redis outage should degrade to "rate limiting is looser", not
      // "the whole site 500s" — fall back to the in-memory limiter for
      // this call rather than throwing.
      // eslint-disable-next-line no-console
      console.error('[rate-limit] Upstash Redis error, falling back to in-memory limiter for this request:', err);
      return memoryRateLimit(key, maxAttempts, windowMs);
    }
  }
  return memoryRateLimit(key, maxAttempts, windowMs);
}

/** Exposed for tests only — lets a test suite assert on the in-memory
 * backend specifically without needing Upstash env vars set. */
export const _internal = { memoryRateLimit };
