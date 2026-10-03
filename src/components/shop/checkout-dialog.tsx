"use client";
import { useEffect,useRef,useState } from "react";
import { X } from "lucide-react";
import type { Product } from "@/lib/shop/catalogue";
import type { CartItem } from "@/lib/shop/validation";
import { Checkout } from "./checkout";
export function CheckoutDialog({items,products,email,enabled,onClose}:{items:CartItem[];products:Product[];email:string|null;enabled:boolean;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);const [paying,setPaying]=useState(false);useEffect(()=>{const d=ref.current;d?.showModal();const original=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=original;d?.close();};},[]);
 return <dialog ref={ref} className="checkout-dialog" aria-busy={paying} onCancel={e=>{if(paying)e.preventDefault();else onClose();}} onClick={e=>{if(e.target===ref.current&&!paying)onClose();}} aria-labelledby="checkout-dialog-title"><div className="checkout-dialog-inner"><div className="dialog-heading"><div><p className="shop-eyebrow">YOUR NEXT CONNECTION</p><h2 id="checkout-dialog-title">Make it yours.</h2></div><button autoFocus className="dialog-close" disabled={paying} onClick={onClose} aria-label="Close checkout"><X size={22}/></button></div><Checkout products={products} email={email} enabled={enabled} initialItems={items} popup onEdit={()=>{if(!paying)onClose();}} onPaymentActivityChange={setPaying}/></div></dialog>;
}

