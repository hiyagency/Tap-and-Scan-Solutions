"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import type { Product } from "@/lib/shop/catalogue";
import styles from "./hero-showcase.module.css";

export function HeroShowcase({products}:{products:Product[]}) {
 const [paused,setPaused]=useState(false);
 const slides=products.flatMap(product=>product.variants.map(variant=>({
  key:variant.id, image:variant.image, href:"/products/"+product.slug,
  name:product.name, design:product.variants.length>1?variant.name:product.platform
 })));
 if(!slides.length)return null;
 return <section className={styles.showcase} aria-label="Explore our NFC products">
  <header><span>DESIGNED TO CONNECT</span><button type="button" onClick={()=>setPaused(!paused)} aria-pressed={paused} aria-label={paused?"Play product showcase":"Pause product showcase"}>{paused?<Play size={16}/>:<Pause size={16}/>}</button></header>
  <div className={styles.window}>
   <div className={styles.track} data-paused={paused} style={{animationDuration:slides.length*6+"s"}}>
    {[0,1].map(copy=><div key={copy} className={styles.group} aria-hidden={copy===1?true:undefined} inert={copy===1?true:undefined}>
     {slides.map((slide,index)=><Link key={slide.key} href={slide.href} className={styles.card} tabIndex={copy===1?-1:undefined}>
      <div className={styles.image}><Image src={slide.image} width={600} height={600} alt="" preload={copy===0&&index===0} sizes="(max-width:700px) 82vw, 40vw"/></div>
      <div className={styles.caption}><span><small>{slide.design}</small><strong>{slide.name}</strong></span><ArrowUpRight size={20}/></div>
     </Link>)}
    </div>)}
   </div>
  </div>
 </section>;
}
