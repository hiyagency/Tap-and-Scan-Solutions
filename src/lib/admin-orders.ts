import "server-only";
import { requireOwner } from "@/lib/admin-auth";
import type { Order, OrderFilters, OrderSummary } from "./order-types";

export const ORDER_PAGE_SIZE = 25;
const selection = "*,shop_order_items(*),shop_admin_order_state(*)";
export async function getOrders(filters: OrderFilters = {}) {
  const db = await requireOwner();
  const page = Math.max(1, Math.min(100000, Math.floor(Number(filters.page) || 1)));
  let query = db.from("shop_orders").select(selection, { count: "exact" });
  const search = (filters.q || "").slice(0, 100).replace(/[^\p{L}\p{N}@+ .-]/gu, "").trim();
  if (search) query = query.or(`reference.ilike.%${search}%,email.ilike.%${search}%,address->>name.ilike.%${search}%,address->>phone.ilike.%${search}%`);
  if (filters.stage === "cancelled") query = query.not("cancelled_at", "is", null);
  else if (filters.stage === "to_process") query = query.in("stage", ["awaiting_design", "design_approved", "production"]).eq("payment_status", "paid").is("cancelled_at", null);
  else if (filters.stage) query = query.eq("stage", filters.stage).is("cancelled_at", null);
  if (filters.payment) query = query.eq("payment_status", filters.payment);
  const { data, error, count } = await query.order("created_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * ORDER_PAGE_SIZE, page * ORDER_PAGE_SIZE - 1).abortSignal(AbortSignal.timeout(10000));
  if (error) { console.error("[admin-orders] list unavailable", error.code); throw new Error("Unable to load orders. Please retry."); }
  return { orders: (data || []) as Order[], count: count || 0, page };
}
export async function getOrderSummary(): Promise<OrderSummary> {
  const db = await requireOwner();
  const { data, error } = await db.rpc("admin_order_summary").abortSignal(AbortSignal.timeout(10000));
  if (error) { console.error("[admin-orders] summary unavailable", error.code); throw new Error("Unable to load order totals."); }
  return data as OrderSummary;
}
export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return null;
  const db = await requireOwner();
  const { data, error } = await db.from("shop_orders").select(selection + ",shop_order_events(*),shop_payments(*),shop_fulfilments(*)")
    .eq("id", id).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
  if (error) { console.error("[admin-orders] detail unavailable", error.code); throw new Error("Unable to load this order."); }
  return data as Order | null;
}
export async function getCustomerOrderTotals(ids: string[]) {
  const db = await requireOwner();
  const totals: Record<string, { order_count: number; total_spent: number; latest_order: string }> = {};
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await db.rpc("admin_customer_order_totals", { p_ids: ids.slice(i, i + 500) });
    if (error) throw new Error("Unable to load customer order totals.");
    for (const row of data || []) totals[row.customer_id] = row;
  }
  return totals;
}
