"use client";
import { useEffect,useRef,useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight,Pause,Play,Nfc } from "lucide-react";
export function HeroMotion(){const [paused,setPaused]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const node=ref.current;if(!node)return;const obs=new IntersectionObserver(([e])=>node.classList.toggle("motion-offscreen",!e.isIntersecting));obs.observe(node);return()=>obs.disconnect();},[]);
 return <div className={"hero-motion"+(paused?" motion-paused":"")} ref={ref} onPointerMove={e=>{if(e.pointerType!=="mouse"||matchMedia("(prefers-reduced-motion: reduce)").matches)return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--mx",((e.clientX-r.left)/r.width-.5)*12+"deg");e.currentTarget.style.setProperty("--my",((e.clientY-r.top)/r.height-.5)*-12+"deg");}} onPointerLeave={e=>{e.currentTarget.style.setProperty("--mx","0deg");e.currentTarget.style.setProperty("--my","0deg");}}>
 <div className="connection-orbit orbit-one"/><div className="connection-orbit orbit-two"/><div className="hero-product-deck"><Link className="floating-product float-left" href="/products/google-reviews" aria-label="Explore Google Review Card"><Image src="/shop/google-reviews.webp" alt="Google review NFC card" width={500} height={500} priority/></Link><Link className="floating-product float-right" href="/products/whatsapp" aria-label="Explore WhatsApp Connect Card"><Image src="/shop/whatsapp.webp" alt="WhatsApp NFC card" width={500} height={500} priority/></Link><Link className="floating-product float-centre" href="/products/instagram" aria-label="Explore Instagram Connect Card"><Image src="/shop/instagram.webp" alt="Instagram NFC card" width={500} height={500} priority/><span>Meet your next connection <ArrowUpRight size={14}/></span></Link></div>
 <span className="tap-badge"><Nfc size={16}/> Tap. Scan. Connect.</span><button className="motion-toggle" aria-label={paused?"Play motion":"Pause motion"} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>;
}

