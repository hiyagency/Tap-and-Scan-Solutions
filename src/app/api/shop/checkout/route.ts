import { randomUUID } from "node:crypto";
import { parcelForItems } from "@/lib/shop/parcel";
import { sameOrigin, requireCustomer, apiError, commerceDb } from "@/lib/shop/server";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { checkoutSchema } from "@/lib/shop/validation";
import { checkoutReady } from "@/lib/shop/readiness";
import { quoteShipping } from "@/lib/shop/nimbuspost";
import { priceItems } from "@/lib/shop/pricing";
import { orderTotals } from "@/lib/shop/totals";
import { checkoutFingerprint } from "@/lib/shop/razorpay-integrity";
import { prepareRazorpayCheckout, reconcileRazorpayOrder } from "@/lib/shop/razorpay";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (!checkoutReady()) return Response.json({ preview: true, error: "Payments are not open yet. Please contact support." }, { status: 503 });
    const user = await requireCustomer();
    const input = checkoutSchema.parse(await req.json());
    const fingerprint = checkoutFingerprint(input);
    const db = commerceDb();
    const previous = await db.from("shop_orders").select("*").eq("user_id", user.id).eq("request_id", input.requestId).maybeSingle();
    if (previous.error) throw new Error("Order storage is temporarily unavailable.");
    // An exact retry reuses reserved stock rather than checking reduced availability again.
    if (previous.data) {
      if (previous.data.checkout_fingerprint !== fingerprint) return Response.json({ error: "Your bag or address changed. Start a fresh checkout." }, { status: 409 });
      if (["paid", "partially_refunded", "refunded"].includes(previous.data.payment_status)) return Response.json({
        code: "ORDER_ALREADY_PAID", orderId: previous.data.id, error: "This order has already been paid. Check My orders.",
      }, { status: 409 });
      if (previous.data.cancelled_at) {
        const payment = await db.from("shop_payments").select("provider,razorpay_order_id,status").eq("order_id", previous.data.id).single();
        if (payment.error) throw new Error("Cancelled order status is temporarily unavailable. Do not pay again.");
        if (payment.data.razorpay_order_id) {
          const result = await reconcileRazorpayOrder(previous.data.id);
          if (result.paid) return Response.json({ code: "ORDER_ALREADY_PAID", orderId: previous.data.id, error: "Payment was captured for this cancelled order. Contact support for reconciliation." }, { status: 409 });
        }
        return Response.json({ code: "ORDER_CANCELLED", orderId: previous.data.id,
          // An issued provider order remains payable. A point-in-time check cannot
          // prove that an already-open payment window will never capture later.
          canRestart: !payment.data.razorpay_order_id && payment.data.status === "pending",
          error: "This order was cancelled. Check its status before beginning another checkout.",
        }, { status: 409 });
      }
      if (previous.data.payment_status !== "pending") return Response.json({ error: "This order is no longer awaiting payment. Check My orders." }, { status: 409 });
      return Response.json(await prepareRazorpayCheckout(previous.data), { headers: { "Cache-Control": "no-store" } });
    }
    const { products, connected } = await getCatalogue();
    if (!connected) throw new Error("Catalogue is temporarily unavailable.");
    const priced = priceItems(input.items, products);
    if (priced.subtotal !== input.subtotalPaise) return Response.json({ error: "Product prices changed. Refresh your bag before paying." }, { status: 409 });
    const quote = await quoteShipping(input.address.pincode, priced.quantity, priced.subtotal, parcelForItems(input.items, products));
    if (quote.amount !== input.shippingPaise) return Response.json({ error: "The shipping rate changed. Please request a fresh quote." }, { status: 409 });
    const totals = orderTotals(priced.subtotal, quote.amount);
    const { data: id, error } = await db.rpc("shop_create_razorpay_order", {
      payload: {
        user_id: user.id, request_id: input.requestId, checkout_fingerprint: fingerprint,
        reference: "NFC-" + randomUUID().slice(0, 12).toUpperCase(), email: user.email, address: input.address,
        subtotal_paise: priced.subtotal, shipping_paise: quote.amount, tax_paise: totals.tax, tax_rate_percent: 18,
        total_paise: totals.total, shipping_provider: "nimbuspost", courier: quote.courier, parcel: quote.parcel,
      }, items: priced.rows,
    });
    if (error) throw new Error("Your order could not be prepared. Stock may have changed; refresh and retry.");
    const { data: order } = await db.from("shop_orders").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!order) throw new Error("Your prepared order could not be loaded. Retry once.");
    return Response.json(await prepareRazorpayCheckout(order), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
