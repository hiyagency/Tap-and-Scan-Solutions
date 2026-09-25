import { createOptionalClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/shop/server";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
export async function POST(request:Request){
 try{sameOrigin(request);const input=await request.json();const next=input.next==="/checkout"?"/checkout":"/account/orders";const client=await createOptionalClient();if(!client)return Response.json({error:"Google sign-in is not configured yet."},{status:503});
 const config=getPublicSupabaseConfig();const settings=await fetch(config.url+"/auth/v1/settings",{headers:{apikey:config.publishableKey},cache:"no-store",signal:AbortSignal.timeout(8000)});if(!settings.ok||(await settings.json()).external?.google!==true)return Response.json({error:"Google sign-in is not enabled yet. Your selection is saved; please try again when the shop opens."},{status:503});
 const origin=new URL(request.url).origin;const callback=new URL("/auth/customer-callback",origin);callback.searchParams.set("next",next);if(input.popup===true)callback.searchParams.set("popup","1");const {data,error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:callback.toString()}});if(error||!data.url)return Response.json({error:"Google sign-in is temporarily unavailable. Please try again."},{status:503});return Response.json({url:data.url});}catch{return Response.json({error:"Could not start sign-in. Please retry."},{status:400});}
}
