import Link from "next/link";
import { money, orderTime, orderUnread, stageLabels, type Order } from "@/lib/order-types";
export function OrderList({ orders }: { orders: Order[] }) {
  if (!orders.length) return <div className="admin-order-empty">No matching orders. New orders will appear here automatically.</div>;
  return <div className="admin-order-list">{orders.map(order => <Link className="admin-order-row" key={order.id} href={"/admin/orders/" + order.id}>
    <div className="order-row-heading"><strong>{order.reference}</strong>{orderUnread(order) && <span className="new-order-dot">New</span>}<time dateTime={order.created_at}>{orderTime(order.created_at)}</time></div>
    <div className="order-row-customer"><span>{order.address.name}</span><strong>{money(order.total_paise)}</strong></div>
    <div className="order-row-footer"><span className={"order-chip payment-" + order.payment_status}>{order.payment_status.replaceAll("_", " ")}</span><span className="order-chip">{order.cancelled_at ? "Cancelled" : stageLabels[order.stage]}</span><small>{order.shop_order_items.reduce((n, item) => n + item.quantity, 0)} items</small></div>
  </Link>)}</div>;
}
