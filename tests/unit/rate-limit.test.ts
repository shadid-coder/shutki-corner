import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit } from '../../src/lib/rate-limit';

describe('rateLimit (in-memory backend — no UPSTASH_* env vars set in tests)', () => {
  beforeEach(() => {
    // Ensure we're exercising the in-memory fallback regardless of what
    // might be set in the environment running these tests.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('allows requests up to the configured max within the window', async () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const result = await rateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests once the max is exceeded within the window', async () => {
    const key = `test-${Math.random()}`;
    await rateLimit(key, 2, 60_000);
    await rateLimit(key, 2, 60_000);
    const third = await rateLimit(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks separate keys independently', async () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    await rateLimit(keyA, 1, 60_000);
    const blockedA = await rateLimit(keyA, 1, 60_000);
    const allowedB = await rateLimit(keyB, 1, 60_000);
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it('resets after the window elapses', async () => {
    const key = `test-${Math.random()}`;
    await rateLimit(key, 1, 20); // 20ms window
    const blocked = await rateLimit(key, 1, 20);
    expect(blocked.allowed).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    const afterWindow = await rateLimit(key, 1, 20);
    expect(afterWindow.allowed).toBe(true);
  });
});
