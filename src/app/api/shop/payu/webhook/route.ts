import { processCallback } from "@/lib/shop/payu";
export async function POST(req:Request){try{const type=req.headers.get("content-type")||"";const fields=type.includes("application/json")?await req.json():Object.fromEntries(await req.formData());await processCallback(fields);return Response.json({ok:true});}catch{return Response.json({error:"Payment could not be verified."},{status:400});}}

