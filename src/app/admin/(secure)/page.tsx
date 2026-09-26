import Link from "next/link";
import { getOrders, getOrderSummary } from "@/lib/admin-orders";
import { money } from "@/lib/order-types";
import { OrderList } from "@/components/admin/order-list";
export default async function AdminDashboard() {
  const [summary, { orders }] = await Promise.all([getOrderSummary(), getOrders()]);
  return <main className="admin-main order-console"><header className="order-page-head"><div><p className="eyebrow">NFCS Orders</p><h1>Good business starts here.</h1><p>Today, in India Standard Time.</p></div><Link className="admin-action-link" href="/admin/orders">All orders →</Link></header>
    <section className="order-kpis" aria-label="Order overview">{[
      ["Orders today", summary.today, "/admin/orders"], ["Revenue today", money(summary.revenue), "/admin/finances"],
      ["Pending payment", summary.pending, "/admin/orders?payment=pending"], ["To process", summary.process, "/admin/orders?stage=production"], ["To ship", summary.ship, "/admin/orders?stage=ready_to_ship"],
    ].map(([label, value, href]) => <Link key={label} href={String(href)}><span>{label}</span><strong>{value}</strong></Link>)}</section>
    <p className="order-help">Revenue: verified payments received today, less refunds on those orders. Cancelled paid orders still require a separate refund.</p>
    <section className="order-section"><div className="order-section-head"><h2>Recent orders</h2><span>{summary.unread} unread paid orders</span></div><OrderList orders={orders.slice(0, 8)}/></section>
    <Link className="admin-action-link" href="/admin/business">Business overview · leads, cash flow and dues →</Link>
  </main>;
}
