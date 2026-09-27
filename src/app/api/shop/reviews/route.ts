import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { sameOrigin,requireCustomer,commerceDb,apiError } from "@/lib/shop/server";
import { getCatalogue } from "@/lib/shop/catalogue-server";

export async function POST(req:Request){
 let reviewId:string|undefined;const uploaded:string[]=[];
 try{
  sameOrigin(req);const user=await requireCustomer();
  const reader=req.body?.getReader();if(!reader)throw new Error("Review is empty.");
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>3*1024*1024){await reader.cancel();throw new Error("Photos must be under 1 MB each.");}chunks.push(r.value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{"content-type":req.headers.get("content-type")||""}}).formData();
  const input=z.object({slug:z.string().regex(/^[a-z0-9-]{1,80}$/),name:z.string().trim().min(2).max(60),rating:z.coerce.number().int().min(1).max(5),body:z.string().trim().min(10).max(2000),consent:z.literal("on")}).parse(Object.fromEntries(form));
  const {products}=await getCatalogue();if(!products.some(p=>p.slug===input.slug&&p.active))throw new Error("Product unavailable.");
  const files=form.getAll("photos").filter((f):f is File=>f instanceof File&&f.size>0);
  if(files.length>2||files.some(f=>f.size>1048576))throw new Error("Add up to two photos, under 1 MB each.");
  const db=commerceDb();
  const {count,error:limitError}=await db.from("shop_reviews").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",new Date(Date.now()-86400000).toISOString());
  if(limitError)throw new Error("Review submissions are not available yet.");
  if((count||0)>=5)throw new Error("Please wait before submitting more reviews.");
  const {data:purchase,error:purchaseError}=await db.from("shop_order_items").select("order_id,shop_orders!inner(user_id,payment_status)").eq("product_slug",input.slug).eq("shop_orders.user_id",user.id).in("shop_orders.payment_status",["paid","partially_refunded","refunded"]).limit(1);
  if(purchaseError)throw new Error("Could not check your purchase. Please retry.");
  const id=randomUUID();
  const {error}=await db.from("shop_reviews").insert({id,user_id:user.id,product_slug:input.slug,display_name:input.name,rating:input.rating,body:input.body,verified_purchase:!!purchase?.length,status:"uploading"});
  if(error){if(error.code==="23505")return Response.json({error:"You have already submitted a review for this product."},{status:409});throw new Error("Could not save your review.");}
  reviewId=id;
  for(const file of files){
   const buffer=Buffer.from(await file.arrayBuffer());
   const image=sharp(buffer,{limitInputPixels:16000000});
   const meta=await image.metadata();if(!["jpeg","png","webp"].includes(meta.format||""))throw new Error("Photos must be JPG, PNG or WebP.");
   const safe=await image.rotate().resize({width:1400,height:1400,fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer();
   const path=user.id+"/"+id+"/"+randomUUID()+".webp";
   const {error:upError}=await db.storage.from("review-photos").upload(path,safe,{contentType:"image/webp",upsert:false});
   if(upError)throw new Error("Photo upload failed. Please retry.");uploaded.push(path);
  }
  const {error:saveError}=await db.from("shop_reviews").update({photos:uploaded,status:"pending"}).eq("id",id).eq("user_id",user.id);
  if(saveError)throw new Error("Could not finish saving your review.");
  return Response.json({ok:true,message:"Thank you. Your review will appear after moderation."});
 }catch(e){
  if(reviewId){const db=commerceDb();if(uploaded.length)await db.storage.from("review-photos").remove(uploaded);await db.from("shop_reviews").delete().eq("id",reviewId).eq("status","uploading");}
  return apiError(e);
 }
}
