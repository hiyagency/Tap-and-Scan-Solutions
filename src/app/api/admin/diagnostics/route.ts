import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireOwner();
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, stage: "server_config" }, { status: 503 });
  const { data, error } = await admin.from("shipments").select("id,title,business_name,city,caption,alt_text,image_path,shipped_on,published,sort_order,created_at").order("shipped_on", { ascending: false }).order("sort_order", { ascending: false });
  if (error) return NextResponse.json({ ok: false, stage: "shipment_query", code: error.code, message: error.message }, { status: 503 });
  return NextResponse.json({ ok: true, stage: "ready", rows: data?.length ?? 0, rowsWithImages: data?.filter((row) => Boolean(row.image_path)).length ?? 0 });
}
