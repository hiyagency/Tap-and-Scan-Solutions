"use client";
import { useEffect, useState } from "react";
export function NotificationSettings() {
  const [message, setMessage] = useState(""), [enabled, setEnabled] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => { const timer = setTimeout(() => { try { setEnabled(localStorage.getItem("admin-order-notifications") === "enabled"); } catch {} }, 0); return () => clearTimeout(timer); }, []);
  async function enable() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) { setMessage("On iPhone, install Orders on your Home Screen and open it there first. Notifications require iOS 16.4 or later."); return; }
    setBusy(true);
    try {
      // Permission is requested only in direct response to this button tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMessage("Notifications were not enabled. You can change permission in your device settings."); return; }
      await navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/", updateViaCache: "none" });
      localStorage.setItem("admin-order-notifications", "enabled"); setEnabled(true); setMessage("Enabled for new verified orders while this app is open. Background Web Push is not active yet.");
    } catch { setMessage("Could not enable notifications. In-app order alerts still work."); }
    finally { setBusy(false); }
  }
  return <section className="order-panel"><h2>Order notifications</h2><p>In-app alerts and unread counts work automatically while you are signed in. Optional device notifications work while Orders is open.</p>{enabled ? <button onClick={() => { try { localStorage.removeItem("admin-order-notifications"); } catch {} setEnabled(false); setMessage("Device notifications disabled for this browser."); }}>Disable device notifications</button> : <button className="order-primary" disabled={busy} onClick={enable}>{busy ? "Enabling…" : "Enable Order Notifications"}</button>}{message && <p role="status">{message}</p>}<h3>Background Web Push</h3><p>Prepared, not activated. The service worker and private subscription storage are ready for a VAPID sender. No background alerts are promised until that sender is configured and tested.</p></section>;
}
