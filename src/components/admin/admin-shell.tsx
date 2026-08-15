import Image from "next/image";
import Link from "next/link";
import { CircleDollarSign, LayoutDashboard, LogOut, UsersRound, UserRoundPlus } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: UserRoundPlus },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/finances", label: "Finances", icon: CircleDollarSign },
];

export function AdminShell({ children, demo }: { children: React.ReactNode; demo: boolean }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/" aria-label="Tap and Scan Solutions home">
          <Image src="/brand/tap-and-scan-logo.png" alt="" width={48} height={48} />
          <span><strong>TAP AND SCAN</strong><small>Owner console</small></span>
        </Link>
        <nav aria-label="Admin navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href}><Icon size={18} aria-hidden="true" />{label}</Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link href="/" target="_blank">View public site</Link>
          {!demo ? (
            <form action={logoutAction}>
              <button type="submit"><LogOut size={17} aria-hidden="true" /> Sign out</button>
            </form>
          ) : null}
        </div>
      </aside>
      <div className="admin-workspace">
        {demo ? (
          <div className="demo-banner" role="status">
            <strong>Preview data.</strong> Connect the supplied Supabase schema and environment variables to enable secure sign-in and live records.
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

