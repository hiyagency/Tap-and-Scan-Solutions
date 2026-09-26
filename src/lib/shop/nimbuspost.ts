import "server-only";
import { z } from "zod";
import { parcelFor, type Parcel } from "./ithink";
import type { Address } from "./validation";
import { taxFor } from "./totals";

const BASE = "https://api-v2.nimbuspost.com/v2/";
async function nimbus(path: string, body?: unknown) {
  const key = process.env.NIMBUSPOST_API_KEY, secret = process.env.NIMBUSPOST_API_SECRET;
  if (!key || !secret) throw new Error("NimbusPost shipping is not configured.");
  const response = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": key, "x-api-secret": secret },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("NimbusPost could not complete this request. Please retry later.");
  const result = await response.json();
  if (result.success !== true) throw new Error("NimbusPost could not complete this request.");
  return result.data;
}
const rateSchema = z.object({
  courierId: z.string().min(1), courierName: z.string().min(1),
  result: z.object({ totalPaise: z.number().int().positive().max(100000000) }),
});
export function selectRate(data: unknown, courierId?: string) {
  if (!Array.isArray(data)) throw new Error("Invalid NimbusPost quote response.");
  const rates = data.flatMap(row => { const r = rateSchema.safeParse(row); return r.success ? [r.data] : []; })
    .filter(r => !courierId || r.courierId === courierId)
    .sort((a,b) => a.result.totalPaise - b.result.totalPaise);
  if (!rates.length) throw new Error("NimbusPost shipping is unavailable for this PIN code. Contact our team.");
  return { amount: rates[0].result.totalPaise, courier: rates[0].courierName, courierId: rates[0].courierId };
}
export async function quoteShipping(pincode: string, quantity: number, subtotal: number) {
  if (!/^[1-9]\d{5}$/.test(pincode) || !/^[1-9]\d{5}$/.test(process.env.NIMBUSPOST_PICKUP_PINCODE || "")) throw new Error("Shipping PIN configuration is incomplete.");
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Invalid parcel quantity.");
  const parcel = parcelFor(quantity);
  const data = await nimbus("serviceability", {
    pickupPincode: process.env.NIMBUSPOST_PICKUP_PINCODE, deliveryPincode: pincode,
    paymentMode: "prepaid", orderValuePaise: subtotal + taxFor(subtotal),
    packages: [{ ...parcel, weight: Math.ceil(parcel.weight * 1000) }],
  });
  const rate = selectRate(data?.available, process.env.NIMBUSPOST_COURIER_ID);
  return { ...rate, parcel: { ...parcel, courier_id: rate.courierId, provider: "nimbuspost" } };
}
export async function bookShipment(order: {reference:string; total_paise:number; shipping_paise:number; address:Address; parcel:Parcel & {courier_id?:string}}, items:{name:string;variant_id:string;quantity:number;price_paise:number}[]) {
  if (process.env.NIMBUSPOST_VERIFIED !== "true") throw new Error("NimbusPost must be verified before booking.");
  if (!process.env.NIMBUSPOST_WAREHOUSE_ID || !order.parcel.courier_id) throw new Error("Pickup warehouse or selected courier is missing.");
  const a = order.address;
  // Never retry automatically: an interrupted response may still have created an order.
  let data;
  try {
    data = await nimbus("shipments", {
      order_number: order.reference, order_type: "b2c", payment_mode: "prepaid",
      warehouse_id: process.env.NIMBUSPOST_WAREHOUSE_ID, courier_id: order.parcel.courier_id,
      shipping_address: { name: a.name, address: a.line1, address_opt: a.line2 || "", city: a.city, state: a.state, pincode: Number(a.pincode), phone: Number(a.phone), country: "India" },
      items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price_paise / 100, sku: i.variant_id })),
      // Booking uses kilograms; serviceability uses grams.
      package: { length: order.parcel.length, width: order.parcel.width, height: order.parcel.height, weight: order.parcel.weight },
    });
  } catch { throw new Error("Check this order in NimbusPost before retrying: booking may have been partially completed."); }
  const booking = data?.booking;
  if (!booking || !/^[a-zA-Z0-9-]+$/.test(String(booking.awb || ""))) throw new Error("Check booking in NimbusPost before retrying.");
  let label: string | null = null;
  try {
    const url = new URL(booking.label_url);
    if (url.protocol === "https:" && !url.username && !url.password && (url.hostname.endsWith(".nimbuspost.com") || url.hostname === "nimbus-assets.s3.amazonaws.com")) label = url.href;
  } catch { /* A missing label does not invalidate a successful booking. */ }
  return { awb: String(booking.awb), label };
}
export async function tracking(awb: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(awb)) throw new Error("Invalid tracking number.");
  const data = await nimbus("tracking/" + encodeURIComponent(awb));
  const status = data?.latest?.shipStatus || data?.orderStatus;
  if (typeof status !== "string") throw new Error("Tracking has not updated yet.");
  return { status, expected: String(data?.shipment?.edd || ""), scans: data?.latest ? [data.latest] : [], updated: new Date().toISOString() };
}
