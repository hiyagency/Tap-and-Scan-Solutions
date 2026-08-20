import { requireOwner } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDiagnosticsPage() {
  await requireOwner();
  const admin = createAdminClient();
  if (!admin) return <main className="admin-main"><p>SERVER_CONFIG_FAILED</p></main>;
  const result = await admin.from("shipments").select("id,image_path", { count: "exact" });
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0] : "missing";
  return <main className="admin-main"><p>{result.error ? `SHIPMENT_QUERY_FAILED:${result.error.code}:${result.error.message}:PROJECT:${projectRef}` : `SHIPMENT_QUERY_READY:${result.count ?? result.data?.length ?? 0}:PROJECT:${projectRef}`}</p></main>;
}
