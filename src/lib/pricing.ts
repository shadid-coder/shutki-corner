export interface PricedLine {
  unitPrice: number;
  qty: number;
}

/** Sum of unitPrice * qty across all lines. Throws on negative qty/price
 * so bad input fails loudly instead of producing a wrong total. */
export function calcSubtotal(lines: PricedLine[]): number {
  return round2(
    lines.reduce((sum, line) => {
      if (line.qty < 0 || line.unitPrice < 0) {
        throw new Error('Negative quantity or price is not allowed');
      }
      return sum + line.unitPrice * line.qty;
    }, 0)
  );
}

export function calcTotal(subtotal: number, deliveryCharge: number): number {
  if (subtotal < 0 || deliveryCharge < 0) {
    throw new Error('Negative subtotal or delivery charge is not allowed');
  }
  return round2(subtotal + deliveryCharge);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
