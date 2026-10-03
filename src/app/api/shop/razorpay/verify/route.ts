import { z } from "zod";
import { apiError, requireCustomer, sameOrigin } from "@/lib/shop/server";
import { verifyRazorpayCheckout } from "@/lib/shop/razorpay";

export const runtime = "nodejs";
const schema = z.object({
  orderId: z.string().uuid(), razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const user = await requireCustomer();
    const input = schema.parse(await req.json());
    const result = await verifyRazorpayCheckout(user.id, input);
    return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
