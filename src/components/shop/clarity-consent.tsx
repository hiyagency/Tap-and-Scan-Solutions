"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global { interface Window { clarity?: Clarity } }
const storageKey = "nfc-analytics-consent";
export function ClarityConsent({projectId}:{projectId:string|undefined}) {
 const pathname = usePathname();
 const [choice,setChoice]=useState<string|null|undefined>(undefined);
 const allowed = pathname==="/" || pathname.startsWith("/products/") || pathname==="/about" || pathname==="/faq";
 // Hydrate browser-only consent after SSR; never read or send tracking data before consent.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{setChoice(localStorage.getItem(storageKey));}catch{setChoice(null);}},[]);
 useEffect(()=>{
  if(!allowed){window.clarity?.("stop");return;}
  if(choice!=="granted"||!projectId||!/^[a-z0-9]+$/i.test(projectId))return;
  if(window.clarity){window.clarity("start");return;}
  const queue:Clarity=(...args)=>{queue.q?.push(args);};queue.q=[];window.clarity=queue;
  queue("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});
  const script=document.createElement("script");script.src="https://www.clarity.ms/tag/"+projectId;script.async=true;script.dataset.clarityLoader="true";document.head.append(script);
  return ()=>{window.clarity?.("stop");};
 },[allowed,choice,projectId]);
 function choose(value:string){try{localStorage.setItem(storageKey,value);}catch{}setChoice(value);if(value==="denied"){window.clarity?.("consentv2",{ad_Storage:"denied",analytics_Storage:"denied"});window.clarity?.("stop");}}
 if(!projectId||!allowed||choice===undefined)return null;
 return choice===null?<aside className="analytics-choice" aria-label="Optional analytics"><p>Help us improve the shop? Microsoft Clarity can record browsing interactions after you agree. Personal forms are excluded. <Link href="/privacy">Privacy</Link></p><div><button onClick={()=>choose("granted")}>Allow analytics</button><button onClick={()=>choose("denied")}>No thanks</button></div></aside>:<button className="analytics-settings" onClick={()=>setChoice(null)}>Analytics preferences</button>;
}
