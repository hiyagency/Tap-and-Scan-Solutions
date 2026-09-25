"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createOptionalClient } from "@/lib/supabase/server";
export async function googleLogin(form:FormData){const next=form.get("next")==="/checkout"?"/checkout":"/account/orders";const client=await createOptionalClient();if(!client)redirect("/account/login?error=Google%20sign-in%20is%20not%20configured%20yet");const h=await headers();const origin=h.get("origin");if(!origin)redirect("/account/login?error=Please%20try%20again");const {data,error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:origin+"/auth/customer-callback?next="+encodeURIComponent(next)}});if(error||!data.url)redirect("/account/login?error=Google%20sign-in%20is%20not%20available%20yet.%20Please%20try%20again%20later.");redirect(data.url);}
export async function customerLogout(){const client=await createOptionalClient();await client?.auth.signOut();redirect("/");}

