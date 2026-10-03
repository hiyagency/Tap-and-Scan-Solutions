import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const orderPattern = /^order_[A-Za-z0-9]+$/;
const paymentPattern = /^pay_[A-Za-z0-9]+$/;
export const isRazorpayOrderId = (value: string) => orderPattern.test(value);
export const isRazorpayPaymentId = (value: string) => paymentPattern.test(value);

export function validRazorpaySignature(message: string, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(Buffer.from(signature, "hex"), expected);
}

export function validCheckoutSignature(storedOrderId: string, paymentId: string, signature: string, secret: string) {
  return isRazorpayOrderId(storedOrderId) && isRazorpayPaymentId(paymentId)
    && validRazorpaySignature(storedOrderId + "|" + paymentId, signature, secret);
}

export type RazorpayPayment = {
  id: string; order_id: string; amount: number; currency: string;
  status: string; captured?: boolean; amount_refunded?: number;
};
export function assertPaymentMatches(payment: RazorpayPayment, storedOrderId: string, amount: number, paymentId?: string) {
  if (!isRazorpayPaymentId(payment.id) || (paymentId && payment.id !== paymentId)
    || payment.order_id !== storedOrderId || payment.currency !== "INR"
    || !Number.isSafeInteger(payment.amount) || payment.amount !== amount || amount <= 0) {
    throw new Error("Payment does not match this order. Contact support before paying again.");
  }
  // Authorisation alone is not money collected. Only captured payments enter the ledger.
  return payment.status === "captured" && payment.captured === true;
}

export function checkoutFingerprint(value: { items: unknown; address: unknown; shippingPaise: number; subtotalPaise: number }) {
  return createHash("sha256").update(JSON.stringify({
    items: value.items, address: value.address, shippingPaise: value.shippingPaise, subtotalPaise: value.subtotalPaise,
  })).digest("hex");
}
