import { describe, it, expect } from 'vitest';
import { validateStock, allStockOk, decrementStockOrThrow, InsufficientStockError, type StockRepo } from '../../src/lib/stock';

describe('validateStock', () => {
  it('passes when requested qty is within available stock', () => {
    const results = validateStock([{ variantId: 'v1', requestedQty: 2, availableQty: 5 }]);
    expect(results[0]!.ok).toBe(true);
    expect(allStockOk(results)).toBe(true);
  });

  it('fails when a variant is out of stock', () => {
    const results = validateStock([{ variantId: 'v1', requestedQty: 1, availableQty: 0 }]);
    expect(results[0]!.ok).toBe(false);
    expect(results[0]!.reasonBn).toContain('স্টকে নেই');
  });

  it('fails when requested qty exceeds available stock', () => {
    const results = validateStock([{ variantId: 'v1', requestedQty: 10, availableQty: 3 }]);
    expect(results[0]!.ok).toBe(false);
    expect(allStockOk(results)).toBe(false);
  });

  it('checks each line independently', () => {
    const results = validateStock([
      { variantId: 'v1', requestedQty: 1, availableQty: 5 },
      { variantId: 'v2', requestedQty: 99, availableQty: 2 }
    ]);
    expect(results[0]!.ok).toBe(true);
    expect(results[1]!.ok).toBe(false);
    expect(allStockOk(results)).toBe(false);
  });
});

describe('decrementStockOrThrow — concurrency safety', () => {
  it('never allows stock to go below zero under concurrent decrements', async () => {
    // Mirrors what `updateMany({ where: { stockQty: { gte: qty } }, data:
    // { stockQty: { decrement: qty } } })` does in Postgres: the
    // check-and-write happens as a single atomic operation per call, so
    // no two concurrent calls can both observe enough stock and both
    // succeed once it runs out.
    let stockQty = 5;
    const repo: StockRepo = {
      async conditionalDecrement(_variantId, qty) {
        if (stockQty >= qty) {
          stockQty -= qty;
          return { success: true };
        }
        return { success: false };
      }
    };

    // 10 concurrent requests for 1 unit each, but only 5 in stock.
    const attempts = Array.from({ length: 10 }, () =>
      decrementStockOrThrow(repo, 'v1', 1)
        .then(() => 'ok' as const)
        .catch((err) => (err instanceof InsufficientStockError ? ('failed' as const) : Promise.reject(err)))
    );
    const results = await Promise.all(attempts);

    expect(results.filter((r) => r === 'ok').length).toBe(5);
    expect(results.filter((r) => r === 'failed').length).toBe(5);
    expect(stockQty).toBe(0); // never negative
  });

  it('throws InsufficientStockError (not a generic error) when the guard fails', async () => {
    const repo: StockRepo = { async conditionalDecrement() { return { success: false }; } };
    await expect(decrementStockOrThrow(repo, 'v1', 1)).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('succeeds and calls through with the requested quantity when stock allows it', async () => {
    let lastCall: { variantId: string; qty: number } | null = null;
    const repo: StockRepo = {
      async conditionalDecrement(variantId, qty) {
        lastCall = { variantId, qty };
        return { success: true };
      }
    };
    await expect(decrementStockOrThrow(repo, 'v42', 3)).resolves.toBeUndefined();
    expect(lastCall).toEqual({ variantId: 'v42', qty: 3 });
  });
});
