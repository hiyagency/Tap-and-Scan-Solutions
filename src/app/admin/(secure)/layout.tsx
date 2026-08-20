import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getOwnerState } from "@/lib/admin-auth";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function SecureAdminLayout({ children }: { children: React.ReactNode }) {
  const state = await getOwnerState();
  if (!state.configured || !state.user) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
