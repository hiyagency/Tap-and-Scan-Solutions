import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { catalogue, standee, type Product } from "./catalogue";
import { keychains } from "./keychains";
const defaults = [standee, ...catalogue, ...keychains];
export const getCatalogue = cache(async (): Promise<{products:Product[]; connected:boolean}> => {
 const db=createAdminClient();
 if(!db) return {products:defaults,connected:false};
 try {
 const {data,error}=await db.from("shop_products").select("data,stock").order("position").abortSignal(AbortSignal.timeout(8000));
 if(error || !data?.length) return {products:defaults,connected:false};
 const saved = data.map(row=>({...row.data,stock:row.stock}) as Product).map(p => {
  const defaultProduct = defaults.find(item => item.slug === p.slug);
  if (!defaultProduct) return p;
  return {...p,variants:p.variants.map(v=>({...v,price_paise:v.price_paise ?? defaultProduct.variants.find(variant=>variant.id===v.id)?.price_paise ?? null}))};
 });
 return {products:[...saved,...defaults.filter(p=>!saved.some(s=>s.slug===p.slug)).map(p=>p.slug===standee.slug?{...p,stock:0}:p)],connected:true};
 } catch { return {products:defaults,connected:false}; }
});
