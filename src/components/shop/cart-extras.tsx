"use client";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/shop/catalogue";
import { priceLabel } from "@/lib/shop/catalogue";
import { cardOffer } from "@/lib/shop/offers";
import type { CartItem } from "@/lib/shop/validation";

export function OfferNote({items,products}:{items:CartItem[];products:Product[]}){
 const offer=cardOffer(items,products);
 return <div className="cart-offer"><strong>Two for you. One on the house.</strong><p>Add any 3 NFC cards and the lowest-priced card is free. Applies to every set of 3 cards.</p>{offer.cardCount>0&&<p aria-live="polite">{offer.freeCount?offer.freeCount+" free card"+(offer.freeCount>1?"s":"")+" unlocked. ":""}{offer.toNext===3?"Add another set of 3 to unlock another free card.":"Add "+offer.toNext+" more card"+(offer.toNext>1?"s":"")+" to unlock your next free card."}</p>}<small>Plus 15% off an NFC stand when stands launch. Stand redemption details will be shared at launch. Tax and delivery charges apply.</small></div>;
}
export function CartExtras({products,excluded=[],onAdd,disabled=false}:{products:Product[];excluded?:string[];onAdd:(product:Product)=>void;disabled?:boolean}){
 return <section className="cart-extras" aria-label="Build your bundle"><h3>Better together</h3><p>Add another way for people to connect.</p><div className="extras-grid">{products.filter(p=>p.active&&!excluded.includes(p.slug)&&p.variants.some(v=>v.available&&v.price_paise!==null)).slice(0,4).map(p=>{const v=p.variants.find(v=>v.available&&v.price_paise!==null)!;return <article key={p.slug}><Link href={"/products/"+p.slug}><Image src={v.image} alt="" width={72} height={72}/><span>{p.name}<small>{priceLabel(v.price_paise)}</small></span></Link><button type="button" disabled={disabled} onClick={()=>onAdd(p)} aria-label={"Add "+p.name}><Plus size={19}/></button></article>;})}</div></section>;
}
export function DeliveryEstimate(){return <div className="delivery-estimate"><strong>Estimated delivery: 7 days</strong><span>From design approval. Timing depends on your PIN code and courier service.</span></div>;}
