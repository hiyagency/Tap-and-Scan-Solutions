"use client";
import { useEffect,useRef,useState, type RefObject } from "react";
export function StickyMobileCart({target,price,disabled,hidden,onAdd,message}:{message?:string;target:RefObject<HTMLDivElement|null>;price:string;disabled:boolean;hidden:boolean;onAdd:()=>void}){
 const [past,setPast]=useState(false);
 const bar=useRef<HTMLElement>(null);
 useEffect(()=>{const node=target.current;if(!node)return;let frame=0;const update=()=>{frame=0;setPast(node.getBoundingClientRect().bottom<=0);};const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};schedule();window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",schedule);return()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);};},[target]);
 useEffect(()=>{const node=bar.current;if(!node)return;const style=document.documentElement.style;const previous=style.getPropertyValue("--sticky-purchase-height");const measure=()=>style.setProperty("--sticky-purchase-height",`${node.getBoundingClientRect().height}px`);measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>{observer.disconnect();if(previous)style.setProperty("--sticky-purchase-height",previous);else style.removeProperty("--sticky-purchase-height");};},[past,hidden]);
 if(!past||hidden)return null;
 return <aside ref={bar} className="sticky-mobile-purchase" aria-label="Quick purchase"><span><strong>{price}</strong><small>+18% tax · Shipping at checkout</small>{message&&<small role="status" className="sticky-purchase-feedback">{message}</small>}</span><button type="button" className="shop-button" disabled={disabled} onClick={onAdd}>Add to Cart</button></aside>;
}
