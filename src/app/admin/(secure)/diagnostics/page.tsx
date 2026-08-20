import { requireOwner } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readShipmentManifest } from "@/lib/shipment-repository";

export default async function AdminDiagnosticsPage() {
  await requireOwner();
  const admin = createAdminClient();
  if (!admin) return <main className="admin-main"><p>SERVER_CONFIG_FAILED</p></main>;
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0] : "missing";
  try {
    const shipments = await readShipmentManifest(admin);
    return <main className="admin-main"><p>{`SHIPMENT_MANIFEST_READY:${shipments.length}:PROJECT:${projectRef}`}</p></main>;
  } catch (error) {
    return <main className="admin-main"><p>{`SHIPMENT_MANIFEST_FAILED:${error instanceof Error ? error.message : "unknown"}:PROJECT:${projectRef}`}</p></main>;
  }
}
