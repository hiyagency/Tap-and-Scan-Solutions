export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type FulfillmentStatus = "awaiting_payment" | "awaiting_design" | "design_approved" | "production" | "ready_to_ship" | "shipped" | "delivered";
export type OrderItem = { id: string; name: string; variant_name: string; quantity: number; price_paise: number; image: string; asset_id: string | null };
export type OrderEvent = { id: string; label: string; event_type: string; created_at: string; created_by: string | null };
export type OrderAdminState = { order_id: string; read_at: string | null; notes: string; updated_at: string };
export type OrderPayment = { txnid: string; provider_id: string | null; provider?: "payu" | "razorpay"; razorpay_order_id?: string | null; status: string; updated_at: string };
export type OrderFulfilment = { awb: string | null; booking_status: string; error: string | null; label_url: string | null; tracking: { status?: string } | null };
export type Order = {
  id: string; reference: string; user_id: string; email: string;
  address: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string };
  created_at: string; updated_at: string; received_at: string | null; cancelled_at: string | null; cancellation_reason: string | null;
  stage: FulfillmentStatus; payment_status: PaymentStatus; subtotal_paise: number; tax_paise?: number; shipping_paise: number; total_paise: number; refunded_paise: number;
  shop_order_items: OrderItem[]; shop_order_events?: OrderEvent[];
  shop_admin_order_state: OrderAdminState | OrderAdminState[] | null;
  shop_payments?: OrderPayment | OrderPayment[] | null;
  shop_fulfilments?: OrderFulfilment | OrderFulfilment[] | null;
};
export type OrderSummary = { today: number; revenue: number; pending: number; process: number; ship: number; unread: number };
export type OrderFilters = { q?: string; stage?: string; payment?: string; page?: string };
export const stageLabels: Record<FulfillmentStatus | "cancelled", string> = {
  awaiting_payment: "Awaiting payment", awaiting_design: "New · design approval", design_approved: "Confirmed",
  production: "Processing", ready_to_ship: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
export function one<T>(value: T | T[] | null | undefined): T | null { return Array.isArray(value) ? value[0] || null : value || null; }
export function orderUnread(order: Pick<Order, "payment_status" | "cancelled_at" | "received_at" | "created_at" | "shop_admin_order_state">) {
  const read = one(order.shop_admin_order_state)?.read_at;
  return order.payment_status === "paid" && !order.cancelled_at && (!read || Date.parse(read) < Date.parse(order.received_at || order.created_at));
}
export function orderTime(value: string) { return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
export function money(paise: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100); }
