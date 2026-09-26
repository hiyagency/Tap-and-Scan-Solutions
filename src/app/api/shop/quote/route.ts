import { z } from "zod";
import { sameOrigin,requireCustomer,apiError } from "@/lib/shop/server";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { cartItemSchema } from "@/lib/shop/validation";
import { priceItems } from "@/lib/shop/pricing";
import { quoteShipping } from "@/lib/shop/nimbuspost";
import { checkoutReady } from "@/lib/shop/readiness";
export async function POST(req:Request){try{sameOrigin(req);if(!checkoutReady())return Response.json({preview:true,error:"Shipping rates will be available when checkout opens."},{status:503});await requireCustomer();const input=z.object({items:z.array(cartItemSchema).min(1).max(20),pincode:z.string().regex(/^[1-9]\d{5}$/)}).parse(await req.json());const {products,connected}=await getCatalogue();if(!connected)throw new Error("Catalogue is temporarily unavailable.");const priced=priceItems(input.items,products);return Response.json(await quoteShipping(input.pincode,priced.quantity,priced.subtotal));}catch(e){return apiError(e);}}
