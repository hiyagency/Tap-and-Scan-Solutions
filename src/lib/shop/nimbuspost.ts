import "server-only";
import { z } from "zod";
import type { Parcel } from "./ithink";
import { addressSchema, type Address } from "./validation";
import { taxFor } from "./totals";
import { getPickup } from './pickup';
import { parcelSchema } from './parcel';

const BASE = "https://api-v2.nimbuspost.com/v2/";
const envelopeSchema = z.object({success:z.boolean(),data:z.unknown().optional(),error:z.object({code:z.string().optional()}).optional()});
const providerError = (status:number,code?:string) => {
  if (status===401 || code==="UNAUTHORIZED") return new Error("NimbusPost authentication needs attention. Please contact our team.");
  if (status===429 || code==="RATE_LIMITED") return new Error("NimbusPost is receiving too many requests. Please retry later.");
  return new Error("NimbusPost could not complete this request. Please retry later.");
};
async function nimbus(path: string, body?: unknown) {
  const key = process.env.NIMBUSPOST_API_KEY, secret = process.env.NIMBUSPOST_API_SECRET;
  if (!key || !secret) throw new Error("NimbusPost shipping is not configured.");
  let response: Response;
  try { response = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": key, "x-api-secret": secret },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
  }); } catch { throw providerError(503); }
  const result = envelopeSchema.safeParse(await response.json().catch(()=>null));
  if (!response.ok || !result.success || result.data.success!==true) throw providerError(response.status,result.success?result.data.error?.code:undefined);
  return result.data.data;
}
const rateSchema = z.object({
  courierId: z.string().min(1), courierName: z.string().min(1),
  tatDays: z.number().int().min(0).max(365).optional(),
  result: z.object({ totalPaise: z.number().int().positive().max(100000000) }),
});
export function selectRate(data: unknown, courierId?: string) {
  if (!Array.isArray(data)) throw new Error("Invalid NimbusPost quote response.");
  const rates = data.flatMap(row => { const r = rateSchema.safeParse(row); return r.success ? [r.data] : []; })
    .filter(r => !courierId || r.courierId === courierId)
    .sort((a,b) => a.result.totalPaise - b.result.totalPaise);
  if (!rates.length) throw new Error("NimbusPost shipping is unavailable for this PIN code. Contact our team.");
  return { amount: rates[0].result.totalPaise, courier: rates[0].courierName, courierId: rates[0].courierId, ...(rates[0].tatDays!==undefined?{deliveryDays:rates[0].tatDays}:{}) };
}
export async function quoteShipping(pincode: string, quantity: number, subtotal: number, configuredParcel: Parcel) {
  if (!/^[1-9]\d{5}$/.test(pincode)) throw new Error("Enter a valid delivery PIN code.");
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Invalid parcel quantity.");
  if (!Number.isSafeInteger(subtotal) || subtotal<=0) throw new Error("Invalid order subtotal.");
  const parsedParcel = parcelSchema.safeParse(configuredParcel);
  if (!parsedParcel.success) throw new Error("Packed shipping measurements are required before requesting a quote.");
  const parcel = parsedParcel.data;
  const pickup = getPickup();
  const data = await nimbus("serviceability", {
    pickupPincode: pickup.pincode, deliveryPincode: pincode,
    paymentMode: "prepaid", orderValuePaise: subtotal + taxFor(subtotal),
    packages: [{ ...parcel, weight: Math.ceil(parcel.weight * 1000) }],
  });
  const parsed = z.object({available:z.array(z.unknown())}).safeParse(data);
  if (!parsed.success) throw new Error("Invalid NimbusPost quote response. Please retry later.");
  const rate = selectRate(parsed.data.available, process.env.NIMBUSPOST_COURIER_ID);
  return { ...rate, parcel: { ...parcel, courier_id: rate.courierId, provider: "nimbuspost" } };
}
export async function bookShipment(order: {reference:string; total_paise:number; shipping_paise:number; address:Address; parcel:Parcel & {courier_id?:string}}, items:{name:string;variant_id:string;quantity:number;price_paise:number}[]) {
  if (process.env.NIMBUSPOST_VERIFIED !== "true") throw new Error("NimbusPost must be verified before booking.");
  const pickup = getPickup();
  const parcel = parcelSchema.parse(order.parcel);
  if (!order.parcel.courier_id || !/^[a-zA-Z0-9-]{1,100}$/.test(order.parcel.courier_id)) throw new Error("Selected courier is missing.");
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(order.reference)) throw new Error("Invalid order reference.");
  const validatedItems = z.array(z.object({name:z.string().min(1).max(200),variant_id:z.string().min(1).max(100),quantity:z.number().int().min(1).max(50),price_paise:z.number().int().min(0).max(1000000000)})).min(1).max(40).parse(items);
  const a = addressSchema.parse(order.address);
  // Never retry automatically: an interrupted response may still have created an order.
  let data;
  try {
    data = await nimbus("shipments", {
      order_number: order.reference, order_type: "b2c", payment_mode: "prepaid",
      warehouse_id: pickup.id, courier_id: order.parcel.courier_id,
      shipping_address: { name: a.name, address: a.line1, address_opt: a.line2 || "", city: a.city, state: a.state, pincode: Number(a.pincode), phone: Number(a.phone), country: "India" },
      items: validatedItems.map(i => ({ name: i.name, qty: i.quantity, price: i.price_paise / 100, sku: i.variant_id })),
      // Booking uses kilograms; serviceability uses grams.
      package: parcel,
    });
  } catch { throw new Error("Check this order in NimbusPost before retrying: booking may have been partially completed."); }
  const parsed = z.object({booking:z.object({awb:z.string().regex(/^[a-zA-Z0-9-]{1,100}$/),label_url:z.string().nullable().optional()})}).safeParse(data);
  if (!parsed.success) throw new Error("Check booking in NimbusPost before retrying.");
  const booking = parsed.data.booking;
  let label: string | null = null;
  try {
    const url = new URL(booking.label_url || "");
    if (url.protocol === "https:" && !url.username && !url.password && (url.hostname.endsWith(".nimbuspost.com") || url.hostname === "nimbus-assets.s3.amazonaws.com")) label = url.href;
  } catch { /* A missing label does not invalidate a successful booking. */ }
  return { awb: String(booking.awb), label };
}
export async function tracking(awb: string) {
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(awb)) throw new Error("Invalid tracking number.");
  const data = await nimbus("tracking/" + encodeURIComponent(awb));
  const parsed = z.object({orderStatus:z.string().optional(),latest:z.object({shipStatus:z.string().optional()}).passthrough().nullable().optional(),shipment:z.object({edd:z.string().nullable().optional()}).nullable().optional()}).safeParse(data);
  if (!parsed.success) throw new Error("Tracking has not updated yet.");
  const status = (parsed.data.latest?.shipStatus || parsed.data.orderStatus)?.trim();
  if (!status) throw new Error("Tracking has not updated yet.");
  return { status, expected: parsed.data.shipment?.edd || "", scans: parsed.data.latest ? [parsed.data.latest] : [], updated: new Date().toISOString() };
}
