import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureShipmentBucket } from "@/lib/shipment-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const admin = createAdminClient();
  const projectRef = configuredUrl ? new URL(configuredUrl).hostname.split(".")[0] : null;
  if (!configuredUrl || !admin) {
    return NextResponse.json({ ok: false, database: "not_configured", projectRef }, { status: 503 });
  }
  try { await ensureShipmentBucket(admin); } catch { /* Report the named storage check below. */ }
  const [shipmentsResult, profilesResult, leadsResult, customersResult, servicesResult, duesResult, transactionsResult, bucketResult, usersResult] = await Promise.all([
    admin.from("shipments").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true }),
    admin.from("customers").select("id", { count: "exact", head: true }),
    admin.from("customer_services").select("id", { count: "exact", head: true }),
    admin.from("dues").select("id", { count: "exact", head: true }),
    admin.from("transactions").select("id", { count: "exact", head: true }),
    admin.storage.getBucket("shipments"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const failedChecks = [
    ["shipments", shipmentsResult.error], ["profiles", profilesResult.error], ["leads", leadsResult.error],
    ["customers", customersResult.error], ["customer_services", servicesResult.error], ["dues", duesResult.error],
    ["transactions", transactionsResult.error], ["shipment_storage", bucketResult.error], ["auth", usersResult.error],
  ].filter(([, error]) => Boolean(error)).map(([name]) => name);
  if (failedChecks.length) {
    return NextResponse.json({ ok: false, database: "schema_incomplete", failedChecks, projectRef }, { status: 503 });
  }
  const ownerUser = usersResult.data.users.find((user) => user.email?.toLowerCase() === "hello@hiy.agency");
  const ownerProfile = ownerUser
    ? await admin.from("profiles").select("role").eq("id", ownerUser.id).maybeSingle()
    : { data: null, error: null };
  return NextResponse.json({
    ok: true,
    database: "ready",
    storage: bucketResult.data?.public ? "shipments_ready" : "shipments_not_public",
    auth: ownerUser && ownerProfile.data?.role === "owner" ? "owner_ready" : "owner_setup_required",
    projectRef,
  });
}
