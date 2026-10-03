"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { type Product,priceLabel } from "@/lib/shop/catalogue";
export function CatalogueGrid({products}:{products:Product[]}){
 const [filter,setFilter]=useState("All products"),[query,setQuery]=useState("");
 const searchInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  let frame=0;
  const focusSearch=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(window.location.hash==="#product-search")searchInput.current?.focus({preventScroll:true});});};
  focusSearch();window.addEventListener("hashchange",focusSearch);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("hashchange",focusSearch);};
 },[]);
 const categories=["All products",...new Set(products.map(p=>p.category))];
 const shown=products.filter(p=>(filter==="All products"||p.category===filter)&&[p.name,p.platform,p.description,p.category].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
 return <section className="collection" id="collection"><div className="collection-heading"><div><p className="shop-eyebrow">THE COLLECTION</p><h2>Find your connection.</h2></div><span>{products.length} products. Choose your next connection.</span></div>
 <div className="catalogue-tools"><div className="shop-filters" role="group" aria-label="Filter products">{categories.map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div><label className="catalogue-search"><Search size={18}/><span className="sr-only">Search products</span><input ref={searchInput} id="product-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a platform or product" aria-label="Search products"/></label></div>
 <p className="catalogue-results" role="status">{shown.length} {shown.length===1?"product":"products"}{query.trim()?' matching “'+query.trim()+'”':""}</p>
 {!shown.length&&<div className="shop-empty"><h3>No matches for this selection.</h3><button className="shop-button secondary" onClick={()=>{setQuery("");setFilter("All products");}}>Show all products</button></div>}
 <div className="product-grid">{shown.map(p=><Link href={`/products/${p.slug}`} className="product-card" key={p.slug}><div className="product-tile"><span className="product-kind">{p.kind==="standee"?"ACRYLIC STANDEE":p.qr===false?"NFC KEYCHAIN":"NFC + QR"}</span><Image src={p.variants[0].image} alt={p.kind==="card"||!p.kind?p.name+" front and back":p.name} width={500} height={500} sizes="(max-width: 600px) 45vw, (max-width: 1000px) 45vw, 30vw"/>{p.stock===0&&<span className="catalogue-stock">Sold out</span>}</div><div className="product-card-info"><div><small>{p.platform}{p.variants.length>1?" · "+p.variants.length+" designs":""}</small><h3>{p.name}</h3></div><strong>{priceLabel(p.variants[0].price_paise)}</strong></div><p className="product-card-benefit">{p.description}</p><span className="product-card-action">{p.variants[0].price_paise===null?"Explore product":"Choose your design"}<ArrowUpRight size={18}/></span></Link>)}</div></section>;
}
