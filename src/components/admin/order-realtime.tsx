"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { orderSummaryAction } from "@/app/admin/order-actions";
import { money, type OrderSummary } from "@/lib/order-types";

const LiveContext = createContext({ unread: 0, connection: "Connecting…" });
export const useOrderLive = () => useContext(LiveContext);
type BadgeNavigator = Navigator & { setAppBadge?: (count: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
export function OrderRealtime({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [connection, setConnection] = useState("Connecting…");
  const [notice, setNotice] = useState<{ id: string; reference: string; name: string; total: number } | null>(null);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    let disposed = false, timer: ReturnType<typeof setTimeout> | undefined, fetching = false;
    const db = createClient();
    const started = Date.now();
    async function sync(refresh = true) {
      if (disposed || fetching || document.visibilityState === "hidden") return;
      fetching = true;
      try {
        const summary: OrderSummary = await orderSummaryAction();
        if (!disposed) {
          setUnread(summary.unread);
          const nav = navigator as BadgeNavigator;
          try { if (summary.unread) await nav.setAppBadge?.(summary.unread); else await nav.clearAppBadge?.(); } catch { /* Unsupported permissions must not block orders. */ }
          if (refresh) router.refresh();
        }
      } catch { if (!disposed) setConnection("Sync paused · retrying"); }
      finally { fetching = false; }
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(() => void sync(), 400); }
    const channel = db.channel("admin-order-console")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_orders" }, payload => {
        const row = payload.new as Record<string, unknown>;
        const id = typeof row.id === "string" ? row.id : "";
        const firstPayment = payload.eventType === "INSERT" || row.received_at === row.updated_at;
        if (id && row.payment_status === "paid" && !row.cancelled_at && firstPayment && !seen.current.has(id) && Date.parse(String(row.received_at || row.created_at)) >= started - 5000) {
          seen.current.add(id);
          if (seen.current.size > 500) seen.current.delete(seen.current.values().next().value!);
          const address = row.address as { name?: string } | undefined;
          const notification = { id, reference: String(row.reference), name: address?.name || "Customer", total: Number(row.total_paise) };
          setNotice(notification);
          try {
            const key = "admin-notified:" + id;
            if (localStorage.getItem("admin-order-notifications") === "enabled" && !localStorage.getItem(key) && document.hasFocus() && "Notification" in window && Notification.permission === "granted") {
              localStorage.setItem(key, "1");
              void navigator.serviceWorker?.getRegistration("/admin/").then(registration => registration?.showNotification("New Order " + notification.reference, { body: money(notification.total) + " • " + notification.name, icon: "/admin/icons/icon-192.png", tag: id, data: { url: "/admin/orders/" + id } })).catch(() => {});
            }
          } catch { /* Private browsing can disable local storage. */ }
        }
        schedule();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_admin_order_state" }, schedule)
      .subscribe(status => {
        if (disposed) return;
        if (status === "SUBSCRIBED") { setConnection("Live"); void sync(); }
        else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) setConnection("Sync paused · retrying");
      });
    const foreground = () => { if (document.visibilityState === "visible") void sync(); };
    const offline = () => setConnection("Offline · changes unavailable");
    document.addEventListener("visibilitychange", foreground);
    window.addEventListener("online", foreground); window.addEventListener("offline", offline);
    const fallback = setInterval(() => void sync(), 60000);
    void sync(false);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/", updateViaCache: "none" }).catch(() => {});
    return () => { disposed = true; clearTimeout(timer); clearInterval(fallback); void db.removeChannel(channel); document.removeEventListener("visibilitychange", foreground); window.removeEventListener("online", foreground); window.removeEventListener("offline", offline); };
  }, [router]);
  return <LiveContext.Provider value={{ unread, connection }}>{children}{notice && <aside className="admin-order-toast" role="status"><div><strong>New Order {notice.reference}</strong><p>{money(notice.total)} · {notice.name}</p><Link href={"/admin/orders/" + notice.id} onClick={() => setNotice(null)}>View order →</Link></div><button aria-label="Dismiss new order notification" onClick={() => setNotice(null)}>×</button></aside>}</LiveContext.Provider>;
}
export function OrderLiveStatus() { const { unread, connection } = useOrderLive(); return <div className="orders-live-status"><span className={connection === "Live" ? "is-live" : ""}>{connection}</span><Link href="/admin/orders">{unread} unread</Link></div>; }
