"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin-auth";
import { commerceDb } from "@/lib/shop/server";
export async function moderateReview(form:FormData){
 await requireOwner();
 const {id,status}=z.object({id:z.string().uuid(),status:z.enum(["approved","rejected"])}).parse(Object.fromEntries(form));
 const {data,error}=await commerceDb().from("shop_reviews").update({status}).eq("id",id).neq("status","uploading").select("product_slug").single();
 if(error||!data)redirect("/admin/reviews?error=Review%20could%20not%20be%20updated");
 revalidatePath("/products/"+data.product_slug);revalidatePath("/admin/reviews");
}
