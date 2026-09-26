"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShoppingBag, UsersRound, Settings } from "lucide-react";
import { useOrderLive } from "./order-realtime";
export function MobileAdminNav() {
  const path = usePathname(); const { unread } = useOrderLive();
  return <nav className="admin-bottom-nav" aria-label="Mobile admin navigation">{[
    { href: "/admin", label: "Home", Icon: House }, { href: "/admin/orders", label: "Orders", Icon: ShoppingBag },
    { href: "/admin/customers", label: "Customers", Icon: UsersRound }, { href: "/admin/settings", label: "Settings", Icon: Settings },
  ].map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={(href === "/admin" ? path === href : path.startsWith(href)) ? "page" : undefined}><span><Icon size={20}/>{label === "Orders" && unread > 0 && <b aria-label={`${unread} unread orders`}>{unread > 99 ? "99+" : unread}</b>}</span>{label}</Link>)}</nav>;
}
