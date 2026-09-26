import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/admin-orders";
import { money, one, orderTime, stageLabels } from "@/lib/order-types";
import { OrderControls } from "@/components/admin/order-controls";
import { OrderManagement } from "@/components/admin/order-management";
export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const order = await getOrder(id); if (!order) notFound();
  const shipment = one(order.shop_fulfilments), payment = one(order.shop_payments), state = one(order.shop_admin_order_state);
  return <main className="admin-main order-console"><Link className="order-back" href="/admin/orders">← Orders</Link><header className="order-page-head"><div><h1>{order.reference}</h1><p>{orderTime(order.created_at)} IST</p><div className="order-row-footer"><span className={"order-chip payment-" + order.payment_status}>{order.payment_status.replaceAll("_", " ")}</span><span className="order-chip">{order.cancelled_at ? "Cancelled" : stageLabels[order.stage]}</span></div></div></header>
    {order.cancelled_at && <p className="commerce-notice">Cancelled: {order.cancellation_reason}. Payments and any refunds remain separately recorded.</p>}
    <div className="order-detail-grid"><div><section className="order-panel"><h2>Items</h2>{order.shop_order_items.map(item => <article className="order-line-item" key={item.id}><Image src={item.image} alt={item.name} width={70} height={70}/><div><strong>{item.name}</strong><p>{item.variant_name} · Qty {item.quantity}</p><small>{money(item.price_paise)} each</small>{item.asset_id && <a href={"/api/shop/assets/" + item.asset_id}>Download private logo</a>}</div><strong>{money(item.price_paise * item.quantity)}</strong></article>)}
      <dl className="order-price-breakdown"><div><dt>Subtotal</dt><dd>{money(order.subtotal_paise)}</dd></div><div><dt>Tax</dt><dd>{money(order.tax_paise || 0)}</dd></div><div><dt>Shipping</dt><dd>{money(order.shipping_paise)}</dd></div><div><dt>Total · INR</dt><dd>{money(order.total_paise)}</dd></div><div><dt>Refunded</dt><dd>{money(order.refunded_paise)}</dd></div></dl><p className="order-help">Tax is recorded separately for new orders; historical totals are preserved.</p></section>
      <section className="order-panel"><h2>Payment</h2><p>PayU · {order.payment_status.replaceAll("_", " ")}</p><dl className="order-meta"><dt>Merchant transaction</dt><dd>{payment?.txnid || "Not available"}</dd><dt>PayU reference</dt><dd>{payment?.provider_id || "Awaiting verified payment"}</dd></dl></section>
      <section className="order-panel"><h2>Timeline</h2><ol className="admin-order-timeline">{[...(order.shop_order_events || [])].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)).map(event => <li key={event.id}><strong>{event.label}</strong><time dateTime={event.created_at}>{orderTime(event.created_at)} IST</time></li>)}</ol></section></div>
      <div><section className="order-panel"><h2>Customer</h2><strong>{order.address.name}</strong><p><a href={"tel:+91" + order.address.phone}>{order.address.phone}</a><br/><a href={"mailto:" + order.email}>{order.email}</a></p><h3>Shipping address</h3><address>{order.address.line1}<br/>{order.address.line2 && <>{order.address.line2}<br/></>}{order.address.city}, {order.address.state}<br/>{order.address.pincode} · {order.address.country || "India"}</address></section>
      <OrderManagement order={{ id, stage: order.stage, updated_at: order.updated_at, payment_status: order.payment_status, cancelled_at: order.cancelled_at }} initialNote={state?.notes || ""}/>
      {shipment && <section className="order-panel"><h2>Shipment</h2><p>{shipment.booking_status} · {shipment.awb || "Requires reconciliation"}</p><p>{shipment.tracking?.status}</p>{shipment.error && <p role="alert">{shipment.error}</p>}{shipment.label_url && <a href={shipment.label_url} target="_blank" rel="noreferrer">Download shipping label</a>}</section>}
      <OrderControls id={id} stage={order.cancelled_at ? "cancelled" : order.stage} phone={order.address.phone} reference={order.reference} hasShipment={!!shipment} managedStatuses/>
      </div></div>
  </main>;
}
