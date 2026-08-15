import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function referenceFromId(id: string) {
  return `TSS-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form details." }, { status: 422 });
  }
  if (parsed.data.website) return NextResponse.json({ error: "Submission rejected." }, { status: 400 });

  const id = randomUUID();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Enquiry storage is not configured. Please call or WhatsApp us." }, { status: 503 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const secret = process.env.LEAD_FINGERPRINT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const fingerprint = createHmac("sha256", secret).update(`${forwardedFor}|${userAgent}`).digest("hex");
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("submission_fingerprint", fingerprint)
    .gte("created_at", oneHourAgo);

  if (countError) return NextResponse.json({ error: "Lead storage is temporarily unavailable." }, { status: 503 });
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "Too many enquiries from this device. Please try again later." }, { status: 429 });

  const { error } = await admin.from("leads").insert({
    id,
    source: "website",
    status: "new",
    name: parsed.data.name,
    business_name: parsed.data.businessName,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    city: parsed.data.city || null,
    business_type: parsed.data.businessType || null,
    interests: parsed.data.interests,
    quantity: parsed.data.quantity || null,
    timeline: parsed.data.timeline || null,
    message: parsed.data.message || null,
    consent_at: new Date().toISOString(),
    submission_fingerprint: fingerprint,
  });

  if (error) return NextResponse.json({ error: "We could not save your enquiry. Please call or WhatsApp us." }, { status: 503 });
  return NextResponse.json({ ok: true, leadId: referenceFromId(id), persisted: true }, { status: 201 });
}
