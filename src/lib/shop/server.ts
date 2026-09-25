import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOptionalClient } from "@/lib/supabase/server";
export function commerceDb(){const db=createAdminClient();if(!db)throw new Error("Shop connection is not configured.");return db;}
export async function customerSession(){const auth=await createOptionalClient();if(!auth)return null;const {data,error}=await auth.auth.getUser();if(error||!data.user||!data.user.app_metadata.providers?.includes("google"))return null;return data.user;}
export async function requireCustomer(){const user=await customerSession();if(!user)throw new Error("Sign in with Google to continue.");return user;}
export function sameOrigin(request:Request){if(request.headers.get("origin")!==new URL(request.url).origin)throw new Error("Invalid request origin.");}
export function apiError(error:unknown,status=400){console.error("[commerce]",error instanceof Error?error.message:"Request failed");return Response.json({error:error instanceof Error?error.message:"Could not complete the request. Please retry."},{status});}
export async function ownedOrder(id:string,userId:string){const {data,error}=await commerceDb().from("shop_orders").select("*,shop_order_items(*),shop_order_events(*),shop_fulfilments(*)").eq("id",id).eq("user_id",userId).maybeSingle();if(error)throw new Error("Orders are temporarily unavailable.");return data;}

