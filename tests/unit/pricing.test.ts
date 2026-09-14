import { describe, it, expect } from 'vitest';
import { calcSubtotal, calcTotal } from '../../src/lib/pricing';

describe('calcSubtotal', () => {
  it('sums unitPrice * qty across lines', () => {
    expect(calcSubtotal([{ unitPrice: 350, qty: 2 }, { unitPrice: 650, qty: 1 }])).toBe(1350);
  });

  it('returns 0 for an empty cart', () => {
    expect(calcSubtotal([])).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    expect(calcSubtotal([{ unitPrice: 10.005, qty: 3 }])).toBe(30.02);
  });

  it('throws on negative quantity', () => {
    expect(() => calcSubtotal([{ unitPrice: 10, qty: -1 }])).toThrow();
  });

  it('throws on negative price', () => {
    expect(() => calcSubtotal([{ unitPrice: -10, qty: 1 }])).toThrow();
  });
});

describe('calcTotal', () => {
  it('adds delivery charge to subtotal', () => {
    expect(calcTotal(1000, 100)).toBe(1100);
  });

  it('throws on negative delivery charge', () => {
    expect(() => calcTotal(1000, -50)).toThrow();
  });
});
