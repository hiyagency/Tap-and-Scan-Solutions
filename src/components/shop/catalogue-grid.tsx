"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Product,priceLabel } from "@/lib/shop/catalogue";
export function CatalogueGrid({products}:{products:Product[]}){
 const [filter,setFilter]=useState("All products");
 return <section className="collection" id="collection"><div className="collection-heading"><div><p className="shop-eyebrow">THE COLLECTION / 01</p><h2>Find your connection.</h2></div><span>{products.length} products. Endless possibilities.</span></div>
 <div className="shop-filters" role="group" aria-label="Filter products">{["All products","Social","Reviews","All-in-one","Keychains"].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
 <div className="product-grid">{products.filter(p=>filter==="All products"||p.category===filter).map((p,i)=><Link href={`/products/${p.slug}`} className="product-card" key={p.slug}><div className="product-tile" style={{background:p.colour}}><span className="product-kind">{p.qr===false?"NFC KEYCHAIN":"NFC + QR"}</span><Image src={p.variants[0].image} alt={p.kind==="keychain"?p.name:p.name+" front and back"} width={500} height={500} sizes="(max-width: 600px) 45vw, (max-width: 1000px) 45vw, 30vw" priority={i<3}/><span className="product-open" aria-hidden="true"><ArrowUpRight size={21}/></span></div><div className="product-card-info"><div><small>{p.platform}{p.variants.length>1?" · "+p.variants.length+" designs":""}</small><h3>{p.name}</h3></div><strong>{priceLabel(p.variants[0].price_paise)}</strong></div></Link>)}</div></section>;
}
