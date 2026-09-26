"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminOrderAction } from "@/app/admin/order-actions";
import type { Order } from "@/lib/order-types";
export function OrderManagement({ order, initialNote }: { order: Pick<Order, "id" | "updated_at" | "stage" | "payment_status" | "cancelled_at">; initialNote: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [note, setNote] = useState(initialNote), [cancelling, setCancelling] = useState(false), [reason, setReason] = useState("");
  useEffect(() => { void adminOrderAction({ id: order.id, expected: null, action: "read" }).catch(() => {}); }, [order.id]);
  async function run(action: string, value = "") {
    setBusy(true); setError("");
    try {
      const result = await adminOrderAction({ id: order.id, expected: order.updated_at, action, value });
      if (result.error) setError(result.error); else { setCancelling(false); setError(action === "note" ? "Note saved." : "Order updated."); router.refresh(); }
    } catch { setError("Unable to save. Check the connection and retry."); }
    finally { setBusy(false); }
  }
  const next: Record<string, [string, string]> = { awaiting_design: ["confirm", "Confirm design approval"], design_approved: ["process", "Mark processing"], production: ["pack", "Mark packed"], shipped: ["deliver", "Mark delivered"] };
  return <section className="order-panel"><h2>Manage order</h2>{!order.cancelled_at && order.payment_status === "paid" && next[order.stage] && <button className="order-primary" disabled={busy} onClick={() => run(next[order.stage][0])}>{next[order.stage][1]}</button>}
    <form onSubmit={e => { e.preventDefault(); void run("note", note); }} className="order-note-form"><label>Internal notes<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={5000} rows={4}/></label><button disabled={busy}>Save note</button><small>Private to the owner. Not shared with the customer.</small></form>
    {!order.cancelled_at && !["shipped", "delivered"].includes(order.stage) && <button className="order-danger" disabled={busy} onClick={() => setCancelling(true)}>Cancel order…</button>}
    {cancelling && <form className="order-cancel-confirm" onSubmit={e => { e.preventDefault(); void run("cancel", reason); }}><h3>Cancel this order?</h3><p>This stops fulfilment. It does not refund payment or cancel a carrier booking.</p><label>Reason<input required minLength={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)}/></label><div><button className="order-danger" disabled={busy}>Confirm cancellation</button><button type="button" onClick={() => setCancelling(false)}>Keep order</button></div></form>}
    {error && <p role="status">{error}</p>}
  </section>;
}
