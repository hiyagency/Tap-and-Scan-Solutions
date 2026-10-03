import { sameOrigin, customerSession, commerceDb } from "@/lib/shop/server";
import { savedCartSchema } from "@/lib/shop/validation";
import { getCatalogue } from "@/lib/shop/catalogue-server";
export async function POST(request:Request) {
 try {
  sameOrigin(request);
  const user=await customerSession();
  if(!user?.email)return Response.json({error:"Please sign in first."},{status:401});
  if(Number(request.headers.get("content-length"))>20000)return new Response(null,{status:413});
  const body=await request.text();
  if(new TextEncoder().encode(body).length>20000)return new Response(null,{status:413});
  let payload:unknown;try{payload=JSON.parse(body);}catch{return Response.json({error:"Invalid request."},{status:400});}
  const input=savedCartSchema.safeParse(payload);
  if(!input.success)return Response.json({error:"Enter your name, valid WhatsApp number and permission."},{status:400});
  const {products,connected}=await getCatalogue();
  if(!connected)throw new Error();
  const items=input.data.items.map(i=>{const p=products.find(p=>p.slug===i.productSlug);const v=p?.variants.find(v=>v.id===i.variantId);if(!p||!v)throw new Error();return {product:p.name,variant:v.name,quantity:i.quantity,price_paise:v.price_paise,logo_attached:!!i.logoId};});
  const db=commerceDb();
  const {error}=await db.from("shop_abandoned_carts").upsert({user_id:user.id,email:user.email,name:input.data.name,phone:input.data.phone,items,updated_at:new Date().toISOString(),consent_at:new Date().toISOString(),status:"open"});
  if(error)throw new Error();
  return Response.json({ok:true});
 } catch {return Response.json({error:"Could not save your cart for follow-up. Please retry."},{status:503});}
}
export async function DELETE(request:Request) {
 try {sameOrigin(request);const user=await customerSession();if(!user)return new Response(null,{status:401});const {error}=await commerceDb().from("shop_abandoned_carts").delete().eq("user_id",user.id);if(error)throw new Error();return Response.json({ok:true});}
 catch{return Response.json({error:"Could not remove the saved cart. Please retry."},{status:503});}
}
