import { NextResponse } from "next/server";
import { processCallback } from "@/lib/shop/payu";
export async function POST(req:Request){try{const form=await req.formData();const fields=Object.fromEntries([...form].filter(([,v])=>typeof v==="string")) as Record<string,string>;const id=await processCallback(fields);return NextResponse.redirect(new URL("/account/orders/"+id,req.url),303);}catch{ return NextResponse.redirect(new URL("/account/orders?notice=Payment%20verification%20is%20pending.%20Do%20not%20pay%20again.%20Refresh%20your%20order%20shortly.",req.url),303);}}

