/**
 * The checkout route does an upfront `findUnique(idempotencyKey)` check
 * before creating an order, but two requests carrying the same key can
 * still both pass that check if they arrive close enough together — the
 * check-then-act sequence isn't atomic by itself. The database's UNIQUE
 * constraint on `idempotencyKey` is what actually prevents two rows from
 * being created; this helper makes sure that when the constraint fires,
 * the *losing* request still gets back the order the *winning* request
 * created, instead of an unhandled 500.
 *
 * Kept generic (no Prisma import) so the race-handling logic itself can
 * be unit tested with an in-memory fake — see
 * tests/unit/idempotent-order.test.ts.
 */
export interface IdempotencyStore<TOrder> {
  findByKey(key: string): Promise<TOrder | null>;
  createOrder(): Promise<TOrder>;
}

export async function createOrderIdempotently<TOrder>(
  key: string,
  store: IdempotencyStore<TOrder>,
  isDuplicateKeyError: (err: unknown) => boolean
): Promise<{ order: TOrder; wasDuplicate: boolean }> {
  try {
    const order = await store.createOrder();
    return { order, wasDuplicate: false };
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;

    // The constraint violation tells us a row with this key now exists
    // (Postgres only reports the conflict once the winning row is
    // durably present), so this lookup should succeed.
    const existing = await store.findByKey(key);
    if (!existing) throw err; // truly unexpected — surface the original error

    return { order: existing, wasDuplicate: true };
  }
}
