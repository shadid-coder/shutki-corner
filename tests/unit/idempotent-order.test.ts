import { describe, it, expect } from 'vitest';
import { createOrderIdempotently, type IdempotencyStore } from '../../src/lib/idempotent-order';

class FakeDuplicateKeyError extends Error {}
class FakeOtherError extends Error {}

interface FakeOrder {
  id: string;
  orderNumber: string;
}

describe('createOrderIdempotently', () => {
  it('returns the newly created order on a normal (non-racing) call', async () => {
    const store: IdempotencyStore<FakeOrder> = {
      async findByKey() {
        return null;
      },
      async createOrder() {
        return { id: 'order-1', orderNumber: 'SC-1' };
      }
    };

    const result = await createOrderIdempotently('key-1', store, () => false);
    expect(result).toEqual({ order: { id: 'order-1', orderNumber: 'SC-1' }, wasDuplicate: false });
  });

  it('returns the existing order when createOrder fails with a duplicate-key error', async () => {
    const existing = { id: 'order-1', orderNumber: 'SC-1' };
    const store: IdempotencyStore<FakeOrder> = {
      async findByKey(key) {
        return key === 'key-1' ? existing : null;
      },
      async createOrder() {
        throw new FakeDuplicateKeyError();
      }
    };

    const result = await createOrderIdempotently('key-1', store, (err) => err instanceof FakeDuplicateKeyError);
    expect(result).toEqual({ order: existing, wasDuplicate: true });
  });

  it('rethrows errors that are not duplicate-key errors', async () => {
    const store: IdempotencyStore<FakeOrder> = {
      async findByKey() {
        return null;
      },
      async createOrder() {
        throw new FakeOtherError('boom');
      }
    };

    await expect(
      createOrderIdempotently('key-1', store, (err) => err instanceof FakeDuplicateKeyError)
    ).rejects.toBeInstanceOf(FakeOtherError);
  });

  it('rethrows the original error if the constraint fired but no row can be found (unexpected state)', async () => {
    const store: IdempotencyStore<FakeOrder> = {
      async findByKey() {
        return null; // nothing found, despite the "duplicate" error
      },
      async createOrder() {
        throw new FakeDuplicateKeyError('unexpected');
      }
    };

    await expect(
      createOrderIdempotently('key-1', store, (err) => err instanceof FakeDuplicateKeyError)
    ).rejects.toBeInstanceOf(FakeDuplicateKeyError);
  });

  it('two concurrent requests for the same key both resolve to the same order (race simulation)', async () => {
    // Simulates the real DB behavior this helper is designed for: the
    // unique-constraint violation is only reported to the losing caller
    // once the winning caller's row is actually durable, so by the time
    // the loser calls findByKey(), the row is there to find.
    let created: FakeOrder | null = null;
    let lockHeld = false;

    const store: IdempotencyStore<FakeOrder> = {
      async findByKey(key) {
        return created && key === 'shared-key' ? created : null;
      },
      async createOrder() {
        // Wait for any in-flight "transaction" to finish, like a DB
        // would serialize concurrent inserts on the same unique value.
        while (lockHeld) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
        if (created) {
          throw new FakeDuplicateKeyError();
        }
        lockHeld = true;
        await new Promise((resolve) => setTimeout(resolve, 5)); // simulate DB round-trip
        created = { id: 'order-shared', orderNumber: 'SC-SHARED' };
        lockHeld = false;
        return created;
      }
    };

    const isDup = (err: unknown) => err instanceof FakeDuplicateKeyError;

    const [a, b] = await Promise.all([
      createOrderIdempotently('shared-key', store, isDup),
      createOrderIdempotently('shared-key', store, isDup)
    ]);

    expect(a.order.id).toBe('order-shared');
    expect(b.order.id).toBe('order-shared');
    // Exactly one of the two requests actually created the row; the
    // other discovered the duplicate and returned the same row instead
    // of erroring out or creating a second one.
    expect([a.wasDuplicate, b.wasDuplicate].sort()).toEqual([false, true]);
  });
});
