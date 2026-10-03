import "server-only";
import { commerceDb } from "./server";
export type PublicReview={id:string;display_name:string;rating:number;body:string;verified_purchase:boolean;created_at:string;photos:string[]};
export type FeaturedReview=Pick<PublicReview,"id"|"display_name"|"rating"|"body"|"verified_purchase"> & {product_slug:string};
export async function featuredReviews(slugs:string[]):Promise<FeaturedReview[]>{
 if(!slugs.length)return [];
 try{
  const {data,error}=await commerceDb().from("shop_reviews")
   .select("id,display_name,rating,body,verified_purchase,product_slug")
   .eq("status","approved").in("product_slug",slugs)
   .order("created_at",{ascending:false}).limit(3)
   .abortSignal(AbortSignal.timeout(2500));
  return error?[]:(data??[]) as FeaturedReview[];
 }catch{return [];}
}
export async function productReviews(slug:string):Promise<{reviews:PublicReview[];available:boolean}>{
 try{
  const db=commerceDb();
  const {data,error}=await db.from("shop_reviews").select("id,display_name,rating,body,verified_purchase,created_at,photos").eq("product_slug",slug).eq("status","approved").order("created_at",{ascending:false}).limit(30);
  if(error)return {reviews:[],available:false};
  const reviews=await Promise.all((data||[]).map(async row=>{
   const photos=await Promise.all((row.photos as string[]).map(async path=>{const {data}=await db.storage.from("review-photos").createSignedUrl(path,3600);return data?.signedUrl||"";}));
   return {...row,photos:photos.filter(Boolean)} as PublicReview;
  }));
  return {reviews,available:true};
 }catch{return {reviews:[],available:false};}
}
