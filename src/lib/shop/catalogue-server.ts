import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { catalogue, type Product } from "./catalogue";
export const getCatalogue = cache(async (): Promise<{products:Product[]; connected:boolean}> => {
 const db=createAdminClient();
 if(!db) return {products:catalogue,connected:false};
 try {
 const {data,error}=await db.from("shop_products").select("data").order("position").abortSignal(AbortSignal.timeout(4000));
 if(error || !data?.length) return {products:catalogue,connected:false};
 return {products:data.map(row=>row.data as Product),connected:true};
 } catch { return {products:catalogue,connected:false}; }
});

