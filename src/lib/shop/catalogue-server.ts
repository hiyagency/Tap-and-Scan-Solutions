import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { catalogue, type Product } from "./catalogue";
import { keychains } from "./keychains";
const defaults = [...catalogue, ...keychains];
export const getCatalogue = cache(async (): Promise<{products:Product[]; connected:boolean}> => {
 const db=createAdminClient();
 if(!db) return {products:defaults,connected:false};
 try {
 const {data,error}=await db.from("shop_products").select("data,stock").order("position").abortSignal(AbortSignal.timeout(8000));
 if(error || !data?.length) return {products:defaults,connected:false};
 const saved = data.map(row=>({...row.data,stock:row.stock}) as Product).map(p => catalogue.some(card => card.slug === p.slug) ? {...p, variants:p.variants.map(v=>({...v,price_paise:v.price_paise ?? 29900}))} : p);
 return {products:[...saved,...keychains.filter(p=>!saved.some(s=>s.slug===p.slug))],connected:true};
 } catch { return {products:defaults,connected:false}; }
});
