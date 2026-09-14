import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from '../../src/lib/order-number';

describe('generateOrderNumber', () => {
  it('embeds the date as YYYYMMDD', () => {
    const date = new Date('2026-09-10T12:00:00Z');
    const orderNumber = generateOrderNumber(date, () => 'ABC123');
    expect(orderNumber).toBe('SC-20260910-ABC123');
  });

  it('produces different suffixes across calls with the default random source', () => {
    const date = new Date('2026-09-10T12:00:00Z');
    const a = generateOrderNumber(date);
    const b = generateOrderNumber(date);
    expect(a).not.toBe(b);
  });
});
