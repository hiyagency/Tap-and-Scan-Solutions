import { randomUUID } from "node:crypto";
import { sameOrigin,requireCustomer,apiError,commerceDb } from "@/lib/shop/server";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { checkoutSchema } from "@/lib/shop/validation";
import { checkoutReady } from "@/lib/shop/readiness";
import { quoteShipping } from "@/lib/shop/ithink";
import { priceItems } from "@/lib/shop/pricing";
import { paymentForm } from "@/lib/shop/payu";
export async function POST(req:Request){try{sameOrigin(req);if(!checkoutReady())return Response.json({preview:true,error:"This is a launch preview. Payments are not open yet."},{status:503});const user=await requireCustomer();const input=checkoutSchema.parse(await req.json());const {products,connected}=await getCatalogue();if(!connected)throw new Error("Catalogue is temporarily unavailable.");const priced=priceItems(input.items,products);const quote=await quoteShipping(input.address.pincode,priced.quantity,priced.subtotal);if(quote.amount!==input.shippingPaise)return Response.json({error:"The shipping rate changed. Please request a fresh quote."},{status:409});const db=commerceDb();const {data:id,error}=await db.rpc("shop_create_order",{payload:{user_id:user.id,request_id:input.requestId,reference:"NFC-"+randomUUID().slice(0,12).toUpperCase(),email:user.email,address:input.address,subtotal_paise:priced.subtotal,shipping_paise:quote.amount,total_paise:priced.subtotal+quote.amount,courier:quote.courier,parcel:quote.parcel},items:priced.rows});if(error)throw new Error("Your order could not be prepared. Please retry.");const {data:order}=await db.from("shop_orders").select("*").eq("id",id).eq("user_id",user.id).single();if(!order||order.payment_status!=="pending")throw new Error("This payment has already been processed. Check My orders.");return Response.json(paymentForm(order,new URL(req.url).origin));}catch(e){return apiError(e);}}

