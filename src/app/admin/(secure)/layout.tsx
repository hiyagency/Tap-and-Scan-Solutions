import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getOwnerState } from "@/lib/admin-auth";

export default async function SecureAdminLayout({ children }: { children: React.ReactNode }) {
  const state = await getOwnerState();
  if (!state.demo && !state.user) redirect("/admin/login");
  return <AdminShell demo={state.demo}>{children}</AdminShell>;
}

