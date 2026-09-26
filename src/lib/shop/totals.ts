export const TAX_RATE_PERCENT = 18;
export function taxFor(subtotal: number) {
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 || subtotal > 1000000000) throw new Error("Invalid taxable subtotal.");
  return Math.round(subtotal * TAX_RATE_PERCENT / 100);
}
export function orderTotals(subtotal: number, shipping: number) {
  if (!Number.isSafeInteger(shipping) || shipping < 0 || shipping > 100000000) throw new Error("Invalid shipping amount.");
  const tax = taxFor(subtotal);
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
