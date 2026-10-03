import Link from "next/link";
import { getOrders, ORDER_PAGE_SIZE } from "@/lib/admin-orders";
import { stageLabels, type OrderFilters } from "@/lib/order-types";
import { OrderList } from "@/components/admin/order-list";
export default async function AdminOrders({ searchParams }: { searchParams: Promise<OrderFilters> }) {
  const filters = await searchParams;
  const { orders, count, page } = await getOrders(filters);
  function pageLink(value: number) { const q = new URLSearchParams({ q: filters.q || "", stage: filters.stage || "", payment: filters.payment || "", page: String(value) }); return "/admin/orders?" + q; }
  return <main className="admin-main order-console"><header className="order-page-head"><div><p className="eyebrow">Online shop</p><h1>Orders</h1><p>Newest first. Changes sync across your open devices.</p></div></header>
    <form className="order-search" method="get"><label className="search-wide">Search orders<input name="q" defaultValue={filters.q} placeholder="Order, customer, phone or email" maxLength={100}/></label><label>Fulfilment<select name="stage" defaultValue={filters.stage || ""}><option value="">All orders</option>{Object.entries(stageLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Payment<select name="payment" defaultValue={filters.payment || ""}><option value="">All payments</option>{["paid", "pending", "failed", "refunded", "partially_refunded"].map(p => <option key={p} value={p}>{p.replaceAll("_", " ")}</option>)}</select></label><button>Apply filters</button></form>
    <div className="order-section-head"><p>{count} matching {count === 1 ? "order" : "orders"}</p><Link href="/admin/orders">Clear filters</Link></div><OrderList orders={orders}/>
    <nav className="order-pagination" aria-label="Order pages">{page > 1 ? <Link href={pageLink(page - 1)}>← Previous</Link> : <span/>}<span>Page {page} of {Math.max(1, Math.ceil(count / ORDER_PAGE_SIZE))}</span>{page * ORDER_PAGE_SIZE < count ? <Link href={pageLink(page + 1)}>Next 25 →</Link> : <span/>}</nav>
    <p className="order-help">Prepaid Razorpay checkout. Stock is reserved during checkout; income is recorded only after verified payment. Older gateway records remain available. COD is not enabled.</p>
  </main>;
}
