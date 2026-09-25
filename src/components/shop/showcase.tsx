"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect,useRef,useState } from "react";
const MotionPlayer=dynamic(()=>import("./showcase-player"),{ssr:false});
export function Showcase(){const ref=useRef<HTMLDivElement>(null);const [active,setActive]=useState(false);
 useEffect(()=>{const mq=window.matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)");const node=ref.current;if(!node)return;const observer=new IntersectionObserver(([e])=>setActive(e.isIntersecting&&mq.matches),{threshold:.15});observer.observe(node);const change=()=>setActive(false);mq.addEventListener("change",change);return()=>{observer.disconnect();mq.removeEventListener("change",change);};},[]);
 return <div ref={ref} className="showcase">{active?<MotionPlayer/>:<Image src="/shop/multi-link-custom.webp" alt="Multi-Link card with room for your logo" width={500} height={500}/>}</div>;
}

