import Image from "next/image";
import Link from "next/link";
import { CircleDollarSign, Images, LayoutDashboard, LogOut, UsersRound, UserRoundPlus, ShoppingBag, Package } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Shop orders", icon: ShoppingBag },
  { href: "/admin/catalogue", label: "Catalogue", icon: Package },
  { href: "/admin/leads", label: "Leads", icon: UserRoundPlus },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/finances", label: "Finances", icon: CircleDollarSign },
  { href: "/admin/shipments", label: "Shipped products", icon: Images },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/" aria-label="NFC.HIY home">
          <Image src="/brand/nfc-hiy.webp" alt="" width={48} height={48} />
          <span><strong>NFC.HIY</strong><small>Owner console</small></span>
        </Link>
        <nav aria-label="Admin navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} prefetch key={href}><Icon size={18} aria-hidden="true" />{label}</Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link href="/" target="_blank">View public site</Link>
          <form action={logoutAction}>
            <button type="submit"><LogOut size={17} aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      </aside>
      <div className="admin-workspace">{children}</div>
    </div>
  );
}
