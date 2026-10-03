import Link from "next/link";
import { requireOwner } from "@/lib/admin-auth";
import { logoutAction } from "@/app/admin/actions";
import { NotificationSettings } from "@/components/admin/notification-settings";
import { launchChecks } from "@/lib/shop/readiness";
import { getCatalogue } from "@/lib/shop/catalogue-server";
export default async function AdminSettings() {
  await requireOwner();
  const checks = launchChecks();
  const catalogue = await getCatalogue();
  const readiness = [
    ["Live checkout switch", checks.checkoutEnabled],
    ["Razorpay live credentials and webhook confirmation", checks.razorpay],
    ["NimbusPost rates and pickup configuration", checks.logistics],
    ["Published policies and provider verification approval", checks.approved],
    ["Live catalogue database connection", catalogue.connected],
  ] as const;
  return <main className="admin-main order-console">
    <header className="order-page-head"><div><p className="eyebrow">NFCS Orders</p><h1>Settings</h1></div></header>
    <section className="order-panel"><h2>Checkout readiness</h2><ul>{readiness.map(([label, ready]) => <li key={label}>{label}: <strong>{ready ? "Configured" : "Pending"}</strong></li>)}</ul><p>These are configuration checks, not proof of a completed payment or dispatch. Only provider-verified captured payments enter income. Fund the NimbusPost wallet before booking shipments.</p></section>
    <section className="order-panel"><h2>Install on your iPhone</h2><ol><li>Open this website’s <strong>/admin</strong> page in Safari and sign in.</li><li>Tap Share, then Add to Home Screen.</li><li>Keep the name Orders and tap Add.</li><li>Open Orders from your Home Screen. Sign in again if Safari asks.</li></ol><p>A connection is required to view and change orders. Private records are never cached for offline use.</p></section>
    <NotificationSettings/>
    <section className="order-panel"><h2>Business tools</h2><nav className="settings-tools"><Link href="/admin/abandoned-carts">Abandoned carts</Link><Link href="/admin/business">Business overview</Link><Link href="/admin/leads">Leads</Link><Link href="/admin/finances">Finances & dues</Link><Link href="/admin/catalogue">Catalogue</Link><Link href="/admin/shipments">Public shipment gallery</Link><Link href="/" target="_blank">View public website ↗</Link></nav></section>
    <section className="order-panel"><h2>Account</h2><p>Owner-only access · hello@hiy.agency</p><form action={logoutAction}><button>Sign out</button></form></section>
  </main>;
}
