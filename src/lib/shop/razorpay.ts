import "server-only";
import { commerceDb } from "./server";
import { assertPaymentMatches, isRazorpayOrderId, isRazorpayPaymentId, validCheckoutSignature, validRazorpaySignature, type RazorpayPayment } from "./razorpay-integrity";

type ShopOrder = {
  id: string; user_id: string; reference: string; email: string; total_paise: number;
  payment_status: string; cancelled_at: string | null; address: { name: string; phone: string };
};
type PaymentRecord = { order_id: string; provider: string; razorpay_order_id: string | null; status: string; provider_id: string | null };
type ProviderOrder = { id: string; amount: number; currency: string; receipt: string; status: string };

function config() {
  const key = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret || process.env.RAZORPAY_ENV !== "production" || !/^rzp_live_[A-Za-z0-9]+$/.test(key)) {
    throw new Error("Live payments are not configured. Please contact support.");
  }
  return { key, secret };
}

class ProviderError extends Error {
  constructor(public definitive: boolean) { super("Razorpay is temporarily unavailable. Please retry shortly."); }
}
async function providerRequest<T>(path: string, body?: object): Promise<T> {
  const { key, secret } = config();
  let response: Response;
  try {
    response = await fetch("https://api.razorpay.com/v1/" + path, {
      method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64"), "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new ProviderError(false); }
  // No provider response body is surfaced to the customer or logs (it can contain personal data).
  if (!response.ok) throw new ProviderError(response.status >= 400 && response.status < 500 && response.status !== 429);
  try { return await response.json() as T; } catch { throw new ProviderError(false); }
}

function assertProviderOrder(provider: ProviderOrder, order: ShopOrder) {
  if (!isRazorpayOrderId(provider.id) || provider.amount !== order.total_paise
    || provider.currency !== "INR" || provider.receipt !== order.id) throw new Error("Payment preparation needs support. Please do not pay again.");
}

async function paymentForOrder(orderId: string) {
  const { data, error } = await commerceDb().from("shop_payments")
    .select("order_id,provider,razorpay_order_id,status,provider_id").eq("order_id", orderId).maybeSingle();
  if (error || !data || data.provider !== "razorpay") throw new Error("Razorpay payment not found.");
  return data as PaymentRecord;
}

export async function prepareRazorpayCheckout(order: ShopOrder) {
  const { key } = config();
  const db = commerceDb();
  const { data: claim, error } = await db.rpc("shop_claim_razorpay_payment", { p_id: order.id, p_user: order.user_id });
  if (error || !claim) throw new Error("This order cannot be paid. Refresh My orders or contact support.");
  if (claim.action === "busy") throw new Error("Your payment is being prepared. Wait a moment, then retry once.");
  let providerId: string | null = claim.razorpay_order_id;
  if (!providerId) {
    let providerOrder: ProviderOrder;
    try {
      if (claim.action === "recover") {
        // A timed-out create request may have succeeded remotely. Never blindly create another one.
        const found = await providerRequest<{ items: ProviderOrder[] }>("orders?receipt=" + encodeURIComponent(order.id) + "&count=100");
        const matches = found.items.filter(item => item.receipt === order.id);
        if (matches.length !== 1) throw new Error("Payment preparation is pending reconciliation. Contact support; do not pay again.");
        providerOrder = matches[0];
      } else {
        providerOrder = await providerRequest<ProviderOrder>("orders", {
          amount: order.total_paise, currency: "INR", receipt: order.id, partial_payment: false,
          notes: { shop_order_id: order.id, shop_reference: order.reference },
        });
      }
      assertProviderOrder(providerOrder, order);
      const saved = await db.rpc("shop_attach_razorpay_order", {
        p_id: order.id, p_provider_order: providerOrder.id, p_amount: providerOrder.amount,
      });
      if (saved.error) throw new Error("Payment preparation could not be saved. Contact support before paying.");
      providerId = providerOrder.id;
    } catch (error) {
      // Only a definite rejection before an order was created permits a fresh create request.
      await db.from("shop_payments").update({ status: error instanceof ProviderError && error.definitive && claim.action === "create" ? "pending" : "review", updated_at: new Date().toISOString() })
        .eq("order_id", order.id).is("razorpay_order_id", null);
      throw error;
    }
  }
  if (!providerId || !isRazorpayOrderId(providerId)) throw new Error("Payment preparation is incomplete.");
  return {
    provider: "razorpay", orderId: order.id, key, razorpayOrderId: providerId,
    amount: order.total_paise, currency: "INR", reference: order.reference,
    prefill: { name: order.address.name, email: order.email, contact: "+91" + order.address.phone },
  };
}

export async function reconcileRazorpayOrder(orderId: string, paymentId?: string, eventId?: string) {
  const payment = await paymentForOrder(orderId);
  const db = commerceDb();
  const { data: order, error } = await db.from("shop_orders").select("id,total_paise,payment_status,cancelled_at").eq("id", orderId).single();
  if (error || !order) throw new Error("Order not found.");
  // A payment previously confirmed by this server remains a resolved checkout
  // even after a refund changes its gateway status. Never invite a second charge.
  if (["paid", "partially_refunded", "refunded"].includes(order.payment_status) && payment.status === "paid" && payment.provider_id) {
    if (paymentId && paymentId !== payment.provider_id) throw new Error("Another payment needs reconciliation. Contact support before paying again.");
    return { orderId, paid: true, paymentStatus: order.payment_status, fulfilmentBlocked: !!order.cancelled_at };
  }
  const providerOrder = payment.razorpay_order_id;
  if (!providerOrder || !isRazorpayOrderId(providerOrder)) return { orderId, paid: false, paymentStatus: "pending" };
  let candidate: RazorpayPayment | undefined;
  if (paymentId) {
    if (!isRazorpayPaymentId(paymentId)) throw new Error("Invalid payment reference.");
    candidate = await providerRequest<RazorpayPayment>("payments/" + paymentId);
  } else {
    const result = await providerRequest<{ items: RazorpayPayment[] }>("orders/" + providerOrder + "/payments");
    candidate = result.items.find(item => item.status === "captured" && item.captured === true);
  }
  if (!candidate || !assertPaymentMatches(candidate, providerOrder, order.total_paise, paymentId)) {
    return { orderId, paid: false, paymentStatus: "pending" };
  }
  const { error: confirmError } = await db.rpc("shop_confirm_razorpay_payment", {
    p_id: orderId, p_provider_order: providerOrder, p_provider_payment: candidate.id,
    p_amount: candidate.amount, p_event_id: eventId || null,
  });
  if (confirmError) throw new Error("Payment was received but reconciliation needs support. Do not pay again.");
  return { orderId, paid: true, paymentStatus: "paid" };
}

export async function verifyRazorpayCheckout(userId: string, input: {
  orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
}) {
  const { secret } = config();
  const { data: order, error } = await commerceDb().from("shop_orders").select("id").eq("id", input.orderId).eq("user_id", userId).maybeSingle();
  if (error || !order) throw new Error("Order not found.");
  const payment = await paymentForOrder(input.orderId);
  if (!payment.razorpay_order_id || input.razorpay_order_id !== payment.razorpay_order_id
    || !validCheckoutSignature(payment.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature, secret)) {
    throw new Error("Invalid payment signature. Contact support before paying again.");
  }
  return reconcileRazorpayOrder(input.orderId, input.razorpay_payment_id);
}

export async function processRazorpayWebhook(raw: string, signature: string, eventId: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !validRazorpaySignature(raw, signature, secret)) throw new Error("Invalid webhook signature.");
  const event = JSON.parse(raw);
  if (!["payment.captured", "order.paid"].includes(event.event)) return;
  const paymentId = event.payload?.payment?.entity?.id;
  const providerOrderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
  if (typeof providerOrderId !== "string" || !isRazorpayOrderId(providerOrderId)
    || (paymentId !== undefined && (typeof paymentId !== "string" || !isRazorpayPaymentId(paymentId)))) throw new Error("Malformed payment event.");
  const db = commerceDb();
  const { data: payment, error } = await db.from("shop_payments").select("order_id")
    .eq("provider", "razorpay").eq("razorpay_order_id", providerOrderId).maybeSingle();
  if (error) throw new Error("Webhook storage is unavailable.");
  // Other integrations in the same merchant account are not orders belonging to this shop.
  if (!payment) return;
  const result = await reconcileRazorpayOrder(payment.order_id, paymentId, eventId || undefined);
  if (!result.paid) throw new Error("Payment capture is awaiting verification.");
}
