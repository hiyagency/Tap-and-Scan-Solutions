import { afterEach, describe, expect, it, vi } from "vitest";
import { checkoutProblemSchema, openRazorpay, pendingPaymentForCustomer, razorpaySessionSchema, razorpayVerificationSchema, remainingCartAfterPayment, type RazorpayConstructor, type RazorpayOptions } from "./razorpay-client";

const session = {
  provider: "razorpay" as const,
  orderId: "00000000-0000-4000-8000-000000000001",
  key: "rzp_test_public123",
  razorpayOrderId: "order_test123",
  amount: 35282,
  currency: "INR" as const,
  reference: "NFC-TEST",
  prefill: { name: "Buyer", email: "buyer@example.test", contact: "+919999999999" },
};
const response = { razorpay_order_id: session.razorpayOrderId, razorpay_payment_id: "pay_test123", razorpay_signature: "a".repeat(64) };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function fakeCheckout() {
  let options!: RazorpayOptions;
  let failed!: (response: { error: { description: string } }) => void;
  const open = vi.fn();
  class Checkout {
    constructor(value: RazorpayOptions) { options = value; }
    open = open;
    on(_event: "payment.failed", handler: typeof failed) { failed = handler; }
  }
  return { Constructor: Checkout as RazorpayConstructor, get options() { return options; }, fail: (message: string) => failed({ error: { description: message } }), open };
}

describe("Razorpay browser checkout", () => {
  it("uses the server amount and order; returns a receipt but not a paid status", async () => {
    const checkout = fakeCheckout();
    const promise = openRazorpay(checkout.Constructor, session, "https://example.test/logo.webp", vi.fn());
    expect(checkout.options.amount).toBe(35282);
    expect(checkout.options.order_id).toBe(session.razorpayOrderId);
    expect(checkout.options.prefill).toEqual(session.prefill);
    checkout.options.handler(response);
    checkout.options.modal.ondismiss();
    expect(await promise).toEqual({ orderId: session.orderId, ...response });
    expect(checkout.open).toHaveBeenCalledOnce();
  });

  it("keeps a failed attempt retryable and resolves cancellation without a receipt", async () => {
    const checkout = fakeCheckout();
    const failed = vi.fn();
    const promise = openRazorpay(checkout.Constructor, session, "/logo.webp", failed);
    checkout.fail("Bank declined this attempt");
    expect(failed).toHaveBeenCalledWith("Bank declined this attempt");
    expect(checkout.options.retry.enabled).toBe(true);
    checkout.options.modal.ondismiss();
    expect(await promise).toBeNull();
  });

  it("allows a successful retry after a failed attempt", async () => {
    const checkout = fakeCheckout();
    const promise = openRazorpay(checkout.Constructor, session, "/logo.webp", vi.fn());
    checkout.fail("Payment failed");
    checkout.options.handler(response);
    expect(await promise).toEqual({ orderId: session.orderId, ...response });
  });

  it("rejects a callback for a different provider order", async () => {
    const checkout = fakeCheckout();
    const promise = openRazorpay(checkout.Constructor, session, "/logo.webp", vi.fn());
    checkout.options.handler({ ...response, razorpay_order_id: "order_other" });
    await expect(promise).rejects.toThrow("could not be matched");
  });

  it("rejects malformed payment sessions and inconsistent server confirmations", () => {
    expect(razorpaySessionSchema.safeParse({ ...session, amount: "xxx" }).success).toBe(false);
    expect(razorpaySessionSchema.safeParse({ ...session, currency: "USD" }).success).toBe(false);
    expect(razorpayVerificationSchema.safeParse({ ok: true, orderId: session.orderId, paid: true, paymentStatus: "pending" }).success).toBe(false);
  });

  it("retains unrelated products and quantities added while payment was open", () => {
    const current = [{ id: "paid", quantity: 3, name: "Card" }, { id: "new", quantity: 1, name: "Stand" }];
    expect(remainingCartAfterPayment(current, [{ id: "paid", quantity: 2 }])).toEqual([{ id: "paid", quantity: 1, name: "Card" }, { id: "new", quantity: 1, name: "Stand" }]);
    expect(remainingCartAfterPayment(current, [{ id: "paid", quantity: 3 }])).toEqual([{ id: "new", quantity: 1, name: "Stand" }]);
  });

  it("restores a pending payment only for the customer who started it", () => {
    const pending = { receipt: { orderId: session.orderId, ...response }, customerEmail: session.prefill.email, purchased: [{ id: session.orderId, quantity: 1 }], buyNow: false };
    expect(pendingPaymentForCustomer(pending, "BUYER@example.test")).toEqual(pending);
    expect(pendingPaymentForCustomer(pending, "other@example.test")).toBeNull();
    expect(pendingPaymentForCustomer(pending, null)).toBeNull();
  });

  it("accepts already captured refunded orders as terminal confirmations", () => {
    expect(razorpayVerificationSchema.safeParse({ ok: true, orderId: session.orderId, paid: true, paymentStatus: "refunded" }).success).toBe(true);
    expect(razorpayVerificationSchema.safeParse({ ok: true, orderId: session.orderId, paid: false, paymentStatus: "partially_refunded" }).success).toBe(false);
    expect(checkoutProblemSchema.safeParse({ code: "ORDER_CANCELLED", orderId: session.orderId, canRestart: true }).success).toBe(true);
    expect(checkoutProblemSchema.safeParse({ code: "ORDER_ALREADY_PAID", orderId: "https://example.test" }).success).toBe(false);
  });
});

function fakeScriptDocument() {
  const scripts: { id: string; src: string; async: boolean; onload: null | (() => void); onerror: null | (() => void); remove: ReturnType<typeof vi.fn> }[] = [];
  const windowMock: { Razorpay?: RazorpayConstructor; setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout } = { setTimeout, clearTimeout };
  vi.stubGlobal("window", windowMock);
  vi.stubGlobal("document", {
    getElementById: () => null,
    createElement: () => { const script = { id: "", src: "", async: false, onload: null, onerror: null, remove: vi.fn() }; scripts.push(script); return script; },
    head: { append: vi.fn() },
  });
  return { scripts, windowMock };
}

describe("Razorpay SDK loading", () => {
  it("shares one on-demand download across concurrent callers", async () => {
    vi.resetModules();
    const { loadRazorpay } = await import("./razorpay-client");
    const mock = fakeScriptDocument();
    const first = loadRazorpay();
    const second = loadRazorpay();
    expect(first).toBe(second);
    expect(mock.scripts).toHaveLength(1);
    expect(mock.scripts[0].src).toBe("https://checkout.razorpay.com/v1/checkout.js");
    const { Constructor } = fakeCheckout();
    mock.windowMock.Razorpay = Constructor;
    mock.scripts[0].onload?.();
    expect(await first).toBe(Constructor);
  });

  it("allows another download after a blocked SDK load", async () => {
    vi.resetModules();
    const { loadRazorpay } = await import("./razorpay-client");
    const mock = fakeScriptDocument();
    const first = loadRazorpay();
    const error = expect(first).rejects.toThrow("could not load");
    mock.scripts[0].onerror?.();
    await error;
    expect(mock.scripts[0].remove).toHaveBeenCalledOnce();
    const retry = loadRazorpay();
    expect(mock.scripts).toHaveLength(2);
    const { Constructor } = fakeCheckout();
    mock.windowMock.Razorpay = Constructor;
    mock.scripts[1].onload?.();
    expect(await retry).toBe(Constructor);
  });
});
