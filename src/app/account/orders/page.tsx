import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopShell } from "@/components/shop/shell";
import { commerceDb,customerSession } from "@/lib/shop/server";
import { priceLabel } from "@/lib/shop/catalogue";
import { customerLogout } from "../actions";
export const metadata={title:"Your orders",robots:{index:false,follow:false}};
export default async function Orders({searchParams}:{searchParams:Promise<{notice?:string}>}){const user=await customerSession();if(!user)redirect("/account/login");const {notice}=await searchParams;const {data,error}=await commerceDb().from("shop_orders").select("id,reference,created_at,total_paise,payment_status,stage").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);return <ShopShell><main id="shop-main" className="shop-page"><p className="shop-eyebrow">YOUR ACCOUNT</p><h1 className="shop-page-title">From our studio to you.</h1><p>{user.email}</p><form action={customerLogout}><button className="plain-button">Sign out</button></form>{notice&&<p role="status" className="preview-note">{notice}</p>}{error?<p className="preview-note">Order history will be available when the shop opens.</p>:!data?.length?<div className="shop-empty"><h2>Your first connection is waiting.</h2><p>Your orders will appear here after checkout.</p><Link href="/" className="shop-button">Explore the collection</Link></div>:data.map(o=><Link className="account-order" href={"/account/orders/"+o.id} key={o.id}><h2>{o.reference}</h2><p>{new Date(o.created_at).toLocaleDateString("en-IN")} · {o.stage.replaceAll("_"," ")}</p><strong>{priceLabel(o.total_paise)}</strong><p>Payment: {o.payment_status.replaceAll("_"," ")} →</p></Link>)}</main></ShopShell>;}

