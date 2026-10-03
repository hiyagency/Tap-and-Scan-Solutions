"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ShoppingBag, UserRound, ArrowUpRight, Search } from "lucide-react";
import { readCart } from "@/lib/shop/cart";
import type { Product } from "@/lib/shop/catalogue";
import { CartDrawer } from "./cart-drawer";
export function PremiumHeader({products}:{products:Product[]}){
 const [cartOpen,setCartOpen]=useState(false);const cartButton=useRef<HTMLButtonElement>(null);
 const menuButton=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[count,setCount]=useState(0),[scrolled,setScrolled]=useState(false);
 useEffect(()=>{const sync=()=>setCount(readCart().reduce((n,i)=>n+i.quantity,0));const scroll=()=>setScrolled(window.scrollY>24);sync();scroll();window.addEventListener("cart-updated",sync);window.addEventListener("storage",sync);window.addEventListener("scroll",scroll,{passive:true});return()=>{window.removeEventListener("cart-updated",sync);window.removeEventListener("storage",sync);window.removeEventListener("scroll",scroll);};},[]);
 return <header className="premium-header" data-scrolled={scrolled} onKeyDown={e=>{if(e.key==="Escape"&&open){setOpen(false);menuButton.current?.focus();}}}>
 <button ref={menuButton} className="mobile-menu-button" aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open} aria-controls="premium-mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
 <div className="premium-brand"><Link className="premium-brand-home" href="/" aria-label="NFC.HIY home" onClick={()=>setOpen(false)}><Image src="/brand/nfc-hiy.webp" width={44} height={44} alt=""/></Link><div className="premium-brand-copy"><Link className="premium-brand-home" href="/" onClick={()=>setOpen(false)}>NFC.HIY</Link><a className="premium-brand-agency" href="https://hiy.agency" target="_blank" rel="noopener noreferrer">Powered by HIY Agency <ArrowUpRight size={10} aria-hidden="true"/></a></div></div>
 <nav className="premium-desktop-nav" aria-label="Main navigation"><Link href="/#collection">Shop products</Link><Link href="/#how-it-works">How it works</Link><Link href="/about">Our story</Link></nav>
 <div className="premium-header-actions"><Link href="/#product-search" aria-label="Search products" className="premium-account" onClick={event=>{if(window.location.pathname!=="/"||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const input=document.getElementById("product-search");if(input){event.preventDefault();window.location.hash="product-search";input.scrollIntoView({block:"start"});input.focus({preventScroll:true});}}}><Search size={20}/></Link><Link href="/account/orders" aria-label="My orders" className="premium-account"><UserRound size={20}/></Link><button type="button" ref={cartButton} onClick={()=>setCartOpen(true)} className="premium-bag" aria-label={`Shopping cart, ${count} items`}><ShoppingBag size={20}/><span className="bag-word">Cart</span><span className="bag-count">{count}</span></button></div>
 {open&&<nav id="premium-mobile-menu" className="premium-mobile-menu" aria-label="Mobile shop navigation">{[["/#collection","Shop products"],["/#how-it-works","How it works"],["/about","Our story"],["/account/orders","My orders"],["/faq","Help & FAQs"]].map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}<ArrowUpRight size={18}/></Link>)}</nav>}
 {cartOpen&&<CartDrawer products={products} onClose={()=>{setCartOpen(false);requestAnimationFrame(()=>cartButton.current?.focus());}}/>}
 </header>;
}
