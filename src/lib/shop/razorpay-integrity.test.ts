import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { assertPaymentMatches, checkoutFingerprint, validCheckoutSignature, validRazorpaySignature } from "./razorpay-integrity";

describe("Razorpay integrity", () => {
  const payment = { id: "pay_Example123", order_id: "order_Example123", amount: 40282, currency: "INR", status: "captured", captured: true };
  const secret = "unit-test-only-secret";
  const signature = createHmac("sha256", secret).update(payment.order_id + "|" + payment.id).digest("hex");
  it("verifies the signature using the stored order and rejects forged signatures", () => {
    expect(validCheckoutSignature(payment.order_id, payment.id, signature, secret)).toBe(true);
    expect(validCheckoutSignature("order_Other", payment.id, signature, secret)).toBe(false);
    expect(validCheckoutSignature(payment.order_id, "pay_Other", signature, secret)).toBe(false);
    expect(validCheckoutSignature(payment.order_id, payment.id, "fake", secret)).toBe(false);
    expect(validCheckoutSignature(payment.order_id, payment.id, signature, "wrong")).toBe(false);
  });
  it("verifies raw webhook bytes, not re-serialised JSON", () => {
    const raw = '{ "event": "payment.captured" }';
    const sig = createHmac("sha256", secret).update(raw).digest("hex");
    expect(validRazorpaySignature(raw, sig, secret)).toBe(true);
    expect(validRazorpaySignature(JSON.stringify(JSON.parse(raw)), sig, secret)).toBe(false);
  });
  it("accepts only captured payments with exact INR amounts", () => {
    expect(assertPaymentMatches(payment, payment.order_id, payment.amount, payment.id)).toBe(true);
    expect(assertPaymentMatches({ ...payment, status: "authorized", captured: false }, payment.order_id, payment.amount)).toBe(false);
    expect(assertPaymentMatches({ ...payment, captured: false }, payment.order_id, payment.amount)).toBe(false);
  });
  it.each([
    { amount: 1 }, { amount: 40282.5 }, { currency: "USD" }, { order_id: "order_Other" }, { id: "not_a_payment" },
  ])("rejects a mismatched provider payment %j", patch => {
    expect(() => assertPaymentMatches({ ...payment, ...patch }, payment.order_id, payment.amount, payment.id)).toThrow("does not match");
  });
  it("binds checkout retries to the exact cart, logos, quantities, shipping and address", () => {
    const value = { items: [{ productSlug: "whatsapp", quantity: 1, logoId: null }], address: { phone: "9999999999" }, shippingPaise: 5000, subtotalPaise: 29900 };
    expect(checkoutFingerprint(value)).toBe(checkoutFingerprint(structuredClone(value)));
    expect(checkoutFingerprint({ ...value, shippingPaise: 0 })).not.toBe(checkoutFingerprint(value));
    expect(checkoutFingerprint({ ...value, items: [{ ...value.items[0], quantity: 2 }] })).not.toBe(checkoutFingerprint(value));
  });
});
