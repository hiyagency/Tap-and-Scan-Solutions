import { describe, expect, it } from "vitest";
import { money, one, orderUnread } from "./order-types";
describe("Admin order state", () => {
  const order = { payment_status: "paid" as const, cancelled_at: null, received_at: "2026-09-25T12:00:00+00:00", created_at: "2026-09-25T11:00:00Z", shop_admin_order_state: null };
  it("only treats verified, non-cancelled payments as unread", () => {
    expect(orderUnread(order)).toBe(true);
    expect(orderUnread({ ...order, payment_status: "pending" })).toBe(false);
    expect(orderUnread({ ...order, cancelled_at: order.created_at })).toBe(false);
  });
  it("compares timestamps consistently across timezone formats", () => {
    expect(orderUnread({ ...order, shop_admin_order_state: { order_id: "id", notes: "", updated_at: "", read_at: "2026-09-25T17:31:00+05:30" } })).toBe(false);
    expect(orderUnread({ ...order, shop_admin_order_state: [{ order_id: "id", notes: "", updated_at: "", read_at: "2026-09-25T11:59:00Z" }] })).toBe(true);
  });
  it("handles nullable one-to-one relationships and paise", () => { expect(one([])).toBe(null); expect(one([{ id: 1 }])).toEqual({ id: 1 }); expect(money(12345)).toContain("123.45"); });
});
