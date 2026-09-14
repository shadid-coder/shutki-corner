export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString('bn-BD', { maximumFractionDigits: 0 })}`;
}
