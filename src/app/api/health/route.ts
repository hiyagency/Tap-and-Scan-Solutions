import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const admin = createAdminClient();
  const projectRef = configuredUrl ? new URL(configuredUrl).hostname.split(".")[0] : null;
  if (!configuredUrl || !admin) {
    return NextResponse.json({ ok: false, database: "not_configured", projectRef }, { status: 503 });
  }
  const { error } = await admin.from("shipments").select("id", { count: "exact", head: true });
  if (error) {
    return NextResponse.json({ ok: false, database: "schema_incomplete", projectRef }, { status: 503 });
  }
  return NextResponse.json({ ok: true, database: "ready", projectRef });
}
