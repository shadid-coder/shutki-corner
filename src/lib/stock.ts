export interface StockCheckInput {
  variantId: string;
  requestedQty: number;
  availableQty: number;
}

export interface StockCheckResult {
  variantId: string;
  ok: boolean;
  reasonBn?: string;
}

/** Validates a cart/checkout against live stock. Pure function so it can
 * be unit tested without a database. This is a fast, user-friendly
 * pre-check only — it reads stock at one point in time and cannot by
 * itself prevent overselling under concurrent checkouts. The actual
 * authoritative guard is the conditional decrement in
 * `decrementStockOrThrow` below, which must run inside the same DB
 * transaction that creates the order. */
export function validateStock(items: StockCheckInput[]): StockCheckResult[] {
  return items.map((item) => {
    if (item.availableQty <= 0) {
      return { variantId: item.variantId, ok: false, reasonBn: 'এই পণ্যটি বর্তমানে স্টকে নেই' };
    }
    if (item.requestedQty > item.availableQty) {
      return {
        variantId: item.variantId,
        ok: false,
        reasonBn: `মাত্র ${item.availableQty}টি স্টকে আছে`
      };
    }
    return { variantId: item.variantId, ok: true };
  });
}

export function allStockOk(results: StockCheckResult[]): boolean {
  return results.every((r) => r.ok);
}

/** Thrown when a conditional stock decrement fails because concurrent
 * orders already consumed the remaining stock. Caught explicitly in the
 * checkout route and mapped to a 409, never a generic 500. */
export class InsufficientStockError extends Error {
  variantId: string;

  constructor(variantId: string) {
    super(`Insufficient stock for variant ${variantId}`);
    this.name = 'InsufficientStockError';
    this.variantId = variantId;
  }
}

/** Minimal interface over "decrement stock only if enough remains",
 * implemented against Prisma in the checkout route via:
 *
 *   tx.productVariant.updateMany({
 *     where: { id: variantId, stockQty: { gte: qty } },
 *     data: { stockQty: { decrement: qty } }
 *   })
 *
 * Postgres executes a single UPDATE...WHERE statement atomically per
 * row — the WHERE condition is evaluated against the row's current,
 * locked value at write time, so two concurrent decrements against the
 * same row cannot both succeed if only one qty's worth of stock remains.
 * This interface exists so that guarantee can be unit tested without a
 * live database (see tests/unit/stock.test.ts). */
export interface StockRepo {
  conditionalDecrement(variantId: string, qty: number): Promise<{ success: boolean }>;
}

export async function decrementStockOrThrow(repo: StockRepo, variantId: string, qty: number): Promise<void> {
  const result = await repo.conditionalDecrement(variantId, qty);
  if (!result.success) {
    throw new InsufficientStockError(variantId);
  }
}
