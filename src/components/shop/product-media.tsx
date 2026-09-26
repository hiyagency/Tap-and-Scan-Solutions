"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play, ImageIcon } from "lucide-react";
import type { Variant } from "@/lib/shop/catalogue";
export function ProductMedia({variant,name,isKeychain=false}:{variant:Variant;name:string;isKeychain?:boolean}){
 const [playing,setPlaying]=useState(false);const ref=useRef<HTMLVideoElement>(null);
 useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(([e])=>{if(!e.isIntersecting)node.pause();});observer.observe(node);return()=>observer.disconnect();},[playing]);
 return <div className="product-media"><div className="product-media-stage">{playing&&variant.video?<video ref={ref} src={variant.video} controls autoPlay muted playsInline preload="none" onError={()=>setPlaying(false)} aria-label={name+" product animation"}/>:<Image src={variant.image} alt={isKeychain?name:name+" front and back"} width={750} height={750} priority sizes="(max-width: 800px) 100vw, 52vw"/>}</div>{variant.video&&<button className="media-toggle" onClick={()=>setPlaying(!playing)}>{playing?<ImageIcon size={16}/>:<Play size={16}/>} {playing?"Product photos":"Watch product film"}</button>}<p>{isKeychain?"AI-enhanced product visual · Set contents listed in specifications":"Product visualisation · Final design confirmed with you"}</p></div>;
}
