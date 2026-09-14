/** Human-facing order number, e.g. SC-20260910-A1B2C3. `seedRandom` is
 * injectable for deterministic unit tests. */
export function generateOrderNumber(date: Date = new Date(), random: () => string = randomSuffix): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `SC-${y}${m}${d}-${random()}`;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
