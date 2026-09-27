export function safeCustomerNext(value: unknown): string {
  return typeof value === "string" && (value === "/checkout" || /^\/products\/[a-z0-9-]{1,80}$/.test(value)) ? value : "/account/orders";
}
