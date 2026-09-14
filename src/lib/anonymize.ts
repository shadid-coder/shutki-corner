/** "Rahim Hossain" -> "Rahim H." Falls back gracefully for single-word
 * or Bengali-script names. */
export function anonymizeName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0] || '';
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0] || '';
  return `${first} ${lastInitial}.`;
}
