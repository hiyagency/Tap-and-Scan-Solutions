"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trash2 } from "lucide-react";
import { readCart,writeCart,removeLogo } from "@/lib/shop/cart";
import type { CartItem } from "@/lib/shop/validation";
import { type Product,priceLabel } from "@/lib/shop/catalogue";
export function CartView({products}:{products:Product[]}){const [items,setItems]=useState<CartItem[]>([]);const [ready,setReady]=useState(false);
 useEffect(()=>{sessionStorage.removeItem("nfc-checkout-mode");const refresh=()=>{setItems(readCart());setReady(true);};refresh();window.addEventListener("storage",refresh);return()=>window.removeEventListener("storage",refresh);},[]);
 function update(next:CartItem[]){writeCart(next);setItems(next);}
 const total=items.reduce((sum,i)=>{const p=products.find(p=>p.slug===i.productSlug);const v=p?.variants.find(v=>v.id===i.variantId);return sum===null||v?.price_paise==null?null:sum+v.price_paise*i.quantity;},0 as number|null);
 if(!ready)return <p role="status">Loading your bag…</p>;
 if(!items.length)return <div className="shop-empty"><h2>Your next connection starts here.</h2><p>Your bag is empty. Find a card that fits your business.</p><Link href="/#collection" className="shop-button">Explore the collection <ArrowRight size={18}/></Link></div>;
 return <div className="cart-layout"><div>{items.map(i=>{const p=products.find(p=>p.slug===i.productSlug);const v=p?.variants.find(v=>v.id===i.variantId);return <article className="cart-row" key={i.id}>{v&&<Image src={v.image} alt="" width={130} height={130}/>}<div><Link href={`/products/${i.productSlug}`}><h2>{p?.name||"Unavailable product"}</h2></Link><p>{v?.name} {i.logoName&&`· Logo: ${i.logoName}`}</p><label>Quantity <input aria-label={`Quantity for ${p?.name}`} type="number" min={1} max={50} value={i.quantity} onChange={e=>update(items.map(row=>row.id===i.id?{...row,quantity:Math.max(1,Math.min(50,Number(e.target.value)||1))}:row))}/></label><button className="plain-button" onClick={()=>{update(items.filter(row=>row.id!==i.id));if(i.logoId)void removeLogo(i.logoId);}}><Trash2 size={14}/> Remove</button></div><strong>{priceLabel(v?.price_paise==null?null:v.price_paise*i.quantity)}</strong></article>;})}</div><aside className="order-summary"><h2>Your bag</h2><div><span>Products</span><strong>{priceLabel(total)}</strong></div><p>Shipping calculated at checkout. Our team confirms your design on WhatsApp.</p><Link href="/checkout" className="shop-button">Continue to checkout <ArrowRight size={18}/></Link><Link href="/#collection" className="plain-button">Keep exploring</Link>{total===null&&<p className="preview-note">Launch preview. No payment will be taken.</p>}</aside></div>;
}
