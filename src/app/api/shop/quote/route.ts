import { parcelForItems } from "@/lib/shop/parcel";
import { z } from "zod";
import { sameOrigin,requireCustomer,apiError } from "@/lib/shop/server";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { cartItemSchema } from "@/lib/shop/validation";
import { priceItems } from "@/lib/shop/pricing";
import { quoteShipping } from "@/lib/shop/nimbuspost";
import { shippingReady } from "@/lib/shop/readiness";
export async function POST(req:Request){try{sameOrigin(req);if(!shippingReady())return Response.json({preview:true,error:"Shipping setup is incomplete. Please contact our team."},{status:503});await requireCustomer();const input=z.object({items:z.array(cartItemSchema).min(1).max(20),pincode:z.string().regex(/^[1-9]\d{5}$/)}).parse(await req.json());const {products,connected}=await getCatalogue();if(!connected)throw new Error("Catalogue is temporarily unavailable.");const priced=priceItems(input.items,products);return Response.json(await quoteShipping(input.pincode,priced.quantity,priced.subtotal,parcelForItems(input.items,products)));}catch(e){return apiError(e);}}
