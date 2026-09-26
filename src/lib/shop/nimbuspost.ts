import "server-only";
import { z } from "zod";
import { parcelFor, type Parcel } from "./ithink";
import type { Address } from "./validation";
import { taxFor } from "./totals";

const BASE = "https://api.nimbuspost.com/v1/";
let token: { value: string; expires: number } | null = null;
async function request(path: string, body?: unknown, auth?: string) {
  const response = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: "Bearer " + auth } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("NimbusPost is temporarily unavailable. Please retry later.");
  const result = await response.json();
  if (result.status !== true) throw new Error("NimbusPost could not complete this request.");
  return result.data;
}
async function authToken() {
  if (token && token.expires > Date.now()) return token.value;
  if (!process.env.NIMBUSPOST_EMAIL || !process.env.NIMBUSPOST_PASSWORD) throw new Error("NimbusPost shipping is not configured.");
  const data = await request("users/login", { email: process.env.NIMBUSPOST_EMAIL, password: process.env.NIMBUSPOST_PASSWORD });
  if (typeof data !== "string" || !data) throw new Error("NimbusPost authentication failed.");
  token = { value: data, expires: Date.now() + 5 * 60 * 1000 };
  return data;
}
async function nimbus(path: string, body?: unknown) { return request(path, body, await authToken()); }
const rateSchema = z.object({
  id: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]),
  name: z.string().min(1),
  total_charges: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
});
export function selectRate(data: unknown, courierId?: string) {
  if (!Array.isArray(data)) throw new Error("Invalid NimbusPost quote response.");
  const rates = data.flatMap(row => { const r = rateSchema.safeParse(row); return r.success && Number(r.data.total_charges) > 0 ? [r.data] : []; })
    .filter(r => !courierId || String(r.id) === courierId)
    .sort((a,b) => Number(a.total_charges) - Number(b.total_charges));
  if (!rates.length) throw new Error("NimbusPost shipping is unavailable for this PIN code. Contact our team.");
  const rate = rates[0];
  const amount = Math.round(Number(rate.total_charges) * 100);
  if (!Number.isSafeInteger(amount) || amount > 100000000) throw new Error("Invalid shipping charge.");
  return { amount, courier: rate.name, courierId: String(rate.id) };
}
export async function quoteShipping(pincode: string, quantity: number, subtotal: number) {
  if (!/^[1-9]\d{5}$/.test(pincode) || !/^[1-9]\d{5}$/.test(process.env.NIMBUSPOST_PICKUP_PINCODE || "")) throw new Error("Shipping PIN configuration is incomplete.");
  const parcel = parcelFor(quantity);
  const data = await nimbus("courier/serviceability", {
    origin: process.env.NIMBUSPOST_PICKUP_PINCODE, destination: pincode,
    payment_type: "prepaid", order_amount: (subtotal + taxFor(subtotal)) / 100,
    weight: Math.ceil(parcel.weight * 1000), length: parcel.length, breadth: parcel.width, height: parcel.height,
  });
  const rate = selectRate(data, process.env.NIMBUSPOST_COURIER_ID);
  return { ...rate, parcel: { ...parcel, courier_id: rate.courierId, provider: "nimbuspost" } };
}
const pickupSchema = z.object({
  warehouse_name: z.string().min(1).max(20), name: z.string().min(1).max(200),
  address: z.string().min(1).max(200), address_2: z.string().optional(),
  city: z.string().min(1).max(40), state: z.string().min(1).max(40),
  pincode: z.string().regex(/^[1-9]\d{5}$/), phone: z.string().regex(/^\d{10}$/),
});
export async function bookShipment(order: {reference:string; total_paise:number; shipping_paise:number; address:Address; parcel:Parcel & {courier_id?:string}}, items:{name:string;variant_id:string;quantity:number;price_paise:number}[]) {
  if (process.env.NIMBUSPOST_VERIFIED !== "true") throw new Error("NimbusPost must be verified before booking.");
  const pickup = pickupSchema.parse(JSON.parse(process.env.NIMBUSPOST_PICKUP_JSON || "{}"));
  if (pickup.pincode !== process.env.NIMBUSPOST_PICKUP_PINCODE || !order.parcel.courier_id) throw new Error("Shipping setup or selected courier is missing.");
  const a = order.address;
  // No automatic retries: booking may have succeeded even after a network timeout.
  const data = await nimbus("shipments", {
    order_number: order.reference, payment_type:"prepaid", order_amount:order.total_paise/100,
    shipping_charges:order.shipping_paise/100, discount:0, cod_charges:0,
    package_weight:Math.ceil(order.parcel.weight*1000), package_length:order.parcel.length,
    package_breadth:order.parcel.width, package_height:order.parcel.height,
    request_auto_pickup:"no", courier_id:order.parcel.courier_id, is_insurance:"0",
    consignee:{name:a.name,address:a.line1,address_2:a.line2||"",city:a.city,state:a.state,pincode:a.pincode,phone:a.phone},
    pickup, order_items:items.map(i=>({name:i.name,qty:i.quantity,price:i.price_paise/100,sku:i.variant_id})),
  });
  if (!data || !/^[a-zA-Z0-9-]+$/.test(String(data.awb_number || ""))) throw new Error("Check booking in NimbusPost before retrying.");
  let label: string | null = null;
  if (data.label) {
    const url = new URL(data.label);
    if (["nimubs-assets.s3.amazonaws.com","nimbus-assets.s3.amazonaws.com"].includes(url.hostname) || url.hostname.endsWith(".nimbuspost.com")) {
      url.protocol = "https:"; label = url.href;
    }
  }
  return { awb: String(data.awb_number), label };
}
export async function tracking(awb: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(awb)) throw new Error("Invalid tracking number.");
  const data = await nimbus("shipments/track/" + encodeURIComponent(awb));
  if (!data || typeof data.status !== "string") throw new Error("Tracking has not updated yet.");
  return { status: data.status, expected: "", scans: Array.isArray(data.history) ? data.history : [], updated: new Date().toISOString() };
}
