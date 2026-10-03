"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { cartIssues } from "@/lib/shop/cart-state";
import { cardOffer } from "@/lib/shop/offers";
import { OfferNote,CartExtras,DeliveryEstimate } from "./cart-extras";
import Image from "next/image";
import { taxFor } from "@/lib/shop/totals";
import { ArrowRight, Trash2 } from "lucide-react";
import { readCart,writeCart,removeLogo } from "@/lib/shop/cart";
import type { CartItem } from "@/lib/shop/validation";
import { type Product,priceLabel } from "@/lib/shop/catalogue";
export function CartView({products}:{products:Product[]}){const [items,setItems]=useState<CartItem[]>([]);const [ready,setReady]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{sessionStorage.removeItem("nfc-checkout-mode");const refresh=()=>{setItems(readCart());setReady(true);};refresh();window.addEventListener("storage",refresh);window.addEventListener("cart-updated",refresh);return()=>{window.removeEventListener("storage",refresh);window.removeEventListener("cart-updated",refresh);};},[]);
 function update(next:CartItem[]){try{writeCart(next);setItems(next);setError("");return true;}catch{setError("Your browser could not save this change. Please retry.");return false;}}
 const gross=items.reduce((sum,i)=>{const p=products.find(p=>p.slug===i.productSlug);const v=p?.variants.find(v=>v.id===i.variantId);return sum===null||v?.price_paise==null?null:sum+v.price_paise*i.quantity;},0 as number|null);
 const issues=cartIssues(items,products);
 const offer=cardOffer(items,products);const total=gross===null?null:gross-offer.discount;
 function addExtra(p:Product){const v=p.variants.find(v=>v.available&&v.price_paise!==null);if(!v||items.length>=20)return;update([...items,{id:crypto.randomUUID(),productSlug:p.slug,variantId:v.id,quantity:1}]);}
 if(!ready)return <p role="status">Loading your bag…</p>;
 if(!items.length)return <div className="shop-empty"><h2>Your next connection starts here.</h2><p>Your bag is empty. Find a card that fits your business.</p><Link href="/#collection" className="shop-button">Explore the collection <ArrowRight size={18}/></Link></div>;
 return <div className="cart-layout"><div><OfferNote items={items} products={products}/>{items.map(i=>{const p=products.find(p=>p.slug===i.productSlug);const v=p?.variants.find(v=>v.id===i.variantId);return <article className="cart-row" key={i.id}>{v&&<Image src={v.image} alt="" width={130} height={130}/>}<div><Link href={`/products/${i.productSlug}`}><h2>{p?.name||"Unavailable product"}</h2></Link><p>{v?.name} {i.logoName&&`· Logo: ${i.logoName}`}</p><label>Quantity <input aria-label={`Quantity for ${p?.name}`} type="number" min={1} max={50} value={i.quantity} onChange={e=>update(items.map(row=>row.id===i.id?{...row,quantity:Math.max(1,Math.min(50,Number(e.target.value)||1))}:row))}/></label><button className="plain-button" onClick={()=>{if(update(items.filter(row=>row.id!==i.id))&&i.logoId)void removeLogo(i.logoId).catch(()=>{});}}><Trash2 size={14}/> Remove</button></div><strong>{priceLabel(v?.price_paise==null?null:v.price_paise*i.quantity)}</strong></article>;})}<CartExtras products={products} onAdd={addExtra} disabled={items.length>=20}/><DeliveryEstimate/></div><aside className="order-summary"><h2>Your bag</h2><div><span>Products</span><strong>{priceLabel(gross)}</strong></div>{offer.discount>0&&<div><span>Free card offer</span><strong>−{priceLabel(offer.discount)}</strong></div>}<div><span>Subtotal</span><strong>{priceLabel(total)}</strong></div><div><span>Tax (18%)</span><strong>{priceLabel(total===null?null:taxFor(total))}</strong></div><p>NimbusPost shipping calculated at checkout. Our team confirms your design on WhatsApp.</p>{error&&<p role="alert" className="shop-error">{error}</p>}{issues.length>0&&<div role="alert" className="shop-error">{issues.map(issue=><p key={issue}>{issue}</p>)}</div>}{issues.length===0?<Link href="/checkout" className="shop-button">Continue to checkout <ArrowRight size={18}/></Link>:<button className="shop-button" disabled>Update cart to checkout</button>}<Link href="/#collection" className="plain-button">Keep exploring</Link>{total===null&&<p className="preview-note">One or more items need a price confirmation. Contact our team before payment.</p>}</aside></div>;
}
