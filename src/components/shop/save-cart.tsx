"use client";
import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/lib/shop/validation";
export function SaveCart({items,email}:{items:CartItem[];email:string|null}) {
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const section=useRef<HTMLElement>(null);
 const saving=useRef(false);
 const pending=useRef<boolean|null>(null);
 const saveRef=useRef(save);
 useEffect(()=>{saveRef.current=save;});
 useEffect(()=>{
  const form=section.current?.closest("form");if(!form||!email)return;
  let timer:ReturnType<typeof setTimeout>;
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{
   const data=new FormData(form);
   if(data.get("cartFollowup")==="on"&&String(data.get("name")||"").trim().length>=2&&/^[6-9]\d{9}$/.test(String(data.get("phone")||"")))void saveRef.current();
  },1000);};
  form.addEventListener("input",schedule);schedule();
  return()=>{clearTimeout(timer);form.removeEventListener("input",schedule);};
 },[email,items]);
 async function save(remove=false){
  const form=section.current?.closest("form");if(!form)return;
  if(saving.current){pending.current=remove;return;}
  const data=new FormData(form);if(!remove&&data.get("cartFollowup")!=="on"){setMessage("Please tick the optional follow-up permission first.");return;}
  saving.current=true;setBusy(true);try{const response=await fetch("/api/shop/saved-cart",{method:remove?"DELETE":"POST",headers:{"content-type":"application/json"},body:remove?undefined:JSON.stringify({items,name:data.get("name"),phone:data.get("phone"),consent:true}),keepalive:true});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not save your cart. Please retry.");setMessage(remove?"Saved follow-up cart removed.":"Cart saved. Our team may contact you if you don’t finish checkout.");}catch(e){setMessage((e as Error).message);}finally{saving.current=false;setBusy(false);const next=pending.current;pending.current=null;if(next!==null)void saveRef.current(next);}
 }
 return <section ref={section} className="full"><label className="consent"><input type="checkbox" name="cartFollowup" disabled={!email||busy} onChange={e=>{if(!e.target.checked)void save(true);}}/><span>Optional: automatically save my cart and allow NFC.HIY to contact me on WhatsApp about completing this purchase. Retained for up to 30 days.</span></label><button type="button" disabled={!email||busy} onClick={()=>void save()}>Save cart for follow-up</button>{" "}<button type="button" disabled={!email||busy} onClick={()=>{const checkbox=section.current?.querySelector<HTMLInputElement>('input[name="cartFollowup"]');if(checkbox)checkbox.checked=false;void save(true);}}>Remove saved follow-up</button>{!email&&<p>Sign in above to save a cart for follow-up.</p>}<p role="status">{message}</p></section>;
}
