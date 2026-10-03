import { z } from "zod";

const checkoutScript = "https://checkout.razorpay.com/v1/checkout.js";
const scriptId = "nfc-razorpay-checkout";

export const razorpaySessionSchema = z.object({
  provider: z.literal("razorpay"),
  orderId: z.string().uuid(),
  key: z.string().regex(/^rzp_(test|live)_[A-Za-z0-9]+$/),
  razorpayOrderId: z.string().regex(/^order_[A-Za-z0-9]+$/),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.literal("INR"),
  reference: z.string().min(1).max(100),
  prefill: z.object({ name: z.string(), email: z.string(), contact: z.string() }),
});
export const razorpayReceiptSchema = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-fA-F0-9]{64}$/),
});
export const razorpayVerificationSchema = z.object({
  ok: z.literal(true),
  orderId: z.string().uuid(),
  paid: z.boolean(),
  paymentStatus: z.enum(["paid", "pending", "partially_refunded", "refunded"]),
}).refine(value => value.paid === (value.paymentStatus !== "pending"), "Payment confirmation is inconsistent");
export const checkoutProblemSchema = z.object({
  code: z.enum(["ORDER_ALREADY_PAID", "ORDER_CANCELLED"]),
  orderId: z.string().uuid(),
  canRestart: z.boolean().optional(),
});
export class CheckoutApiError extends Error {
  constructor(message: string, public problem: z.infer<typeof checkoutProblemSchema>) { super(message); }
}

export type RazorpaySession = z.infer<typeof razorpaySessionSchema>;
export type RazorpayReceipt = z.infer<typeof razorpayReceiptSchema>;
export const pendingPaymentSchema = z.object({
  receipt: razorpayReceiptSchema,
  customerEmail: z.string().trim().email().toLowerCase(),
  purchased: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(50) })).min(1).max(20),
  buyNow: z.boolean(),
});
export type PendingPayment = z.infer<typeof pendingPaymentSchema>;
export function pendingPaymentForCustomer(value: unknown, email: string | null): PendingPayment | null {
  if (!email) return null;
  const parsed = pendingPaymentSchema.safeParse(value);
  return parsed.success && parsed.data.customerEmail === email.trim().toLowerCase() ? parsed.data : null;
}
export const checkoutRequestCacheSchema = z.object({
  signature: z.string(),
  requestId: z.string().uuid(),
  uploads: z.array(z.tuple([z.string().uuid(), z.string().uuid()])).default([]),
});

/** Remove paid quantities only; another tab may have added items while payment was open. */
export function remainingCartAfterPayment<T extends { id: string; quantity: number }>(current: T[], purchased: PendingPayment["purchased"]): T[] {
  const quantities = new Map(purchased.map(item => [item.id, item.quantity]));
  return current.flatMap(item => {
    const quantity = item.quantity - (quantities.get(item.id) || 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}
type PaymentResponse = Omit<RazorpayReceipt, "orderId">;
type PaymentFailure = { error?: { description?: string; reason?: string } };
export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  image: string;
  order_id: string;
  prefill: RazorpaySession["prefill"];
  theme: { color: string };
  retry: { enabled: boolean };
  modal: { ondismiss: () => void; confirm_close: boolean; animation: boolean };
  handler: (response: PaymentResponse) => void;
};
export type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: PaymentFailure) => void) => void;
};
export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;
declare global { interface Window { Razorpay?: RazorpayConstructor } }

let scriptPromise: Promise<RazorpayConstructor> | null = null;

/** Only download the payment SDK when a customer starts a payment. */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") return Promise.reject(new Error("Open checkout in your browser to pay."));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;
  const loading = new Promise<RazorpayConstructor>((resolve, reject) => {
    const previous = document.getElementById(scriptId);
    previous?.remove();
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = checkoutScript;
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 20000);
    const cleanup = () => { window.clearTimeout(timeout); script.onload = null; script.onerror = null; };
    const fail = () => { cleanup(); script.remove(); reject(new Error("Secure payment could not load. Check your connection and try again.")); };
    script.onload = () => { cleanup(); if (window.Razorpay) resolve(window.Razorpay); else fail(); };
    script.onerror = fail;
    document.head.append(script);
  }).catch(error => { scriptPromise = null; throw error; });
  scriptPromise = loading;
  return loading;
}

/** A failed attempt can retry within Razorpay. Dismissal never means payment success. */
export function openRazorpay(
  Constructor: RazorpayConstructor,
  session: RazorpaySession,
  image: string,
  onFailure: (message: string) => void,
): Promise<RazorpayReceipt | null> {
  return new Promise((resolve, reject) => {
    let completed = false;
    const finish = (value: RazorpayReceipt | null) => { if (!completed) { completed = true; resolve(value); } };
    const instance = new Constructor({
      key: session.key,
      amount: session.amount,
      currency: session.currency,
      name: "NFC.HIY",
      description: "Order " + session.reference,
      image,
      order_id: session.razorpayOrderId,
      prefill: session.prefill,
      theme: { color: "#151515" },
      retry: { enabled: true },
      modal: { ondismiss: () => finish(null), confirm_close: true, animation: false },
      handler: response => {
        if (completed) return;
        const receipt = razorpayReceiptSchema.safeParse({ ...response, orderId: session.orderId });
        if (!receipt.success || receipt.data.razorpay_order_id !== session.razorpayOrderId) {
          completed = true;
          reject(new Error("Payment confirmation could not be matched. Check My orders before trying another payment."));
          return;
        }
        finish(receipt.data);
      },
    });
    instance.on("payment.failed", response => {
      if (!completed) onFailure(response.error?.description || "Payment did not complete. You can retry securely in the payment window.");
    });
    instance.open();
  });
}
