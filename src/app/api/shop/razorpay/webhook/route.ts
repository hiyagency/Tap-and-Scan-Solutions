import { processRazorpayWebhook } from "@/lib/shop/razorpay";

export const runtime = "nodejs";
export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 262144) return Response.json({ error: "Payload too large." }, { status: 413 });
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 262144) return Response.json({ error: "Payload too large." }, { status: 413 });
  const signature = req.headers.get("x-razorpay-signature") || "";
  const eventId = req.headers.get("x-razorpay-event-id");
  if (eventId && eventId.length > 200) return Response.json({ error: "Invalid event." }, { status: 400 });
  try {
    await processRazorpayWebhook(raw, signature, eventId);
    return Response.json({ ok: true });
  } catch (error) {
    // Non-2xx requests retry; acknowledge only after verification + ledger transaction.
    const invalid = error instanceof Error && ["Invalid webhook signature.", "Malformed payment event."].includes(error.message);
    console.error("[razorpay-webhook]", invalid ? "Rejected signature or payload" : "Verification pending; provider should retry");
    return Response.json({ error: invalid ? "Invalid event." : "Payment verification is pending." }, { status: invalid ? 400 : 503 });
  }
}
