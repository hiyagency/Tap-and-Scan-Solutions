"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cardOffer } from "@/lib/shop/offers";
import { OfferNote,CartExtras,DeliveryEstimate } from "./cart-extras";
import { LockKeyhole,ArrowRight } from "lucide-react";
import { readCart,readLogo,writeCart } from "@/lib/shop/cart";
import { addressSchema,cartItemSchema,type CartItem } from "@/lib/shop/validation";
import { type Product,priceLabel } from "@/lib/shop/catalogue";
import { createClient } from "@/lib/supabase/client";
import { taxFor, orderTotals } from "@/lib/shop/totals";
import { GoogleButton } from "./google-button";
import { SaveCart } from "./save-cart";
import { CheckoutApiError,checkoutProblemSchema,checkoutRequestCacheSchema,loadRazorpay,openRazorpay,pendingPaymentForCustomer,remainingCartAfterPayment,razorpaySessionSchema,razorpayVerificationSchema,type PendingPayment,type RazorpayReceipt } from "@/lib/shop/razorpay-client";
const receiptKey="nfc-razorpay-verification";
async function jsonRequest(path:string,body:unknown,method="POST"){const res=await fetch(path,{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});let data;try{data=await res.json();}catch{throw new Error("The connection paused. Please try again.");}if(!res.ok){const problem=checkoutProblemSchema.safeParse(data);if(problem.success)throw new CheckoutApiError(data.error||"Please check your existing order.",problem.data);throw new Error(data.error||"Please try again.");}return data;}
export function Checkout({products,email,enabled,initialItems,popup=false,onEdit,onPaymentActivityChange}:{onEdit?:()=>void;onPaymentActivityChange?:(active:boolean)=>void;products:Product[];email:string|null;enabled:boolean;initialItems?:CartItem[];popup?:boolean}){
 const router=useRouter();
 const [items,setItems]=useState<CartItem[]>(initialItems||[]),[ready,setReady]=useState(!!initialItems),[error,setError]=useState(""),[busy,setBusy]=useState(false),[shipping,setShipping]=useState<number|null>(null),[quotedPin,setQuotedPin]=useState("");
 const [status,setStatus]=useState(""),[pendingReceipt,setPendingReceipt]=useState<RazorpayReceipt|null>(null);
 const [attentionOrderId,setAttentionOrderId]=useState<string|null>(null);
 const operation=useRef(false),uploadedLogos=useRef(new Map<string,string>()),uploadedOwner=useRef(email),pendingContext=useRef<PendingPayment|null>(null);
 function markBusy(active:boolean){setBusy(active);onPaymentActivityChange?.(active);}
 useEffect(()=>{if(initialItems)return;const timer=setTimeout(()=>{try{const buy=new URLSearchParams(location.search).get("buy")==="now";if(buy)sessionStorage.setItem("nfc-checkout-mode","buy");const raw=sessionStorage.getItem("nfc-checkout-mode")==="buy"?JSON.parse(sessionStorage.getItem("nfc-buy-now")||"[]"):readCart();setItems(cartItemSchema.array().parse(raw));}catch{setItems([]);}setReady(true);},0);return()=>clearTimeout(timer);},[initialItems]);
 useEffect(()=>{const timer=setTimeout(()=>{try{const pending=pendingPaymentForCustomer(JSON.parse(sessionStorage.getItem(receiptKey)||"null"),email);pendingContext.current=pending;setPendingReceipt(pending?.receipt??null);setStatus(pending?"Your payment is awaiting confirmation. Check its status before starting another payment.":"");}catch{}},0);return()=>clearTimeout(timer);},[email]);
 const gross=items.reduce((sum,i)=>{const v=products.find(p=>p.slug===i.productSlug)?.variants.find(v=>v.id===i.variantId);return sum===null||v?.price_paise==null?null:sum+v.price_paise*i.quantity;},0 as number|null);
 const offer=cardOffer(items,products);const total=gross===null?null:gross-offer.discount;
 function addExtra(p:Product){const v=p.variants.find(v=>v.available&&v.price_paise!==null);if(!v||busy||pendingReceipt||attentionOrderId||items.length>=20)return;const next=[...items,{id:crypto.randomUUID(),productSlug:p.slug,variantId:v.id,quantity:1}];setItems(next);setShipping(null);setQuotedPin("");if(initialItems||sessionStorage.getItem("nfc-checkout-mode")==="buy")sessionStorage.setItem("nfc-buy-now",JSON.stringify(next));else writeCart(next);sessionStorage.removeItem("nfc-payment-request");}
 async function quote(form:HTMLFormElement){if(operation.current||pendingReceipt)return;const input=Object.fromEntries(new FormData(form));const pincode=String(input.pincode||"").trim();if(!/^[1-9]\d{5}$/.test(pincode)){setError("Enter a valid six-digit PIN code.");return;}operation.current=true;markBusy(true);setShipping(null);setError("");setStatus("Calculating delivery charges…");try{const q=await jsonRequest("/api/shop/quote",{items,pincode});if(!Number.isSafeInteger(q.amount)||q.amount<0)throw new Error("A shipping rate could not be confirmed. Please try again.");const current=(form.elements.namedItem("pincode") as HTMLInputElement|null)?.value.trim();if(current===pincode){setShipping(q.amount);setQuotedPin(pincode);setStatus("Shipping calculated. Your full total is shown below.");}}catch(e){setError((e as Error).message);setStatus("");}finally{operation.current=false;markBusy(false);}}
 function clearPaidCart(context:Pick<PendingPayment,"purchased"|"buyNow">|null){try{if(context&&!context.buyNow)writeCart(remainingCartAfterPayment(readCart(),context.purchased));sessionStorage.removeItem(receiptKey);sessionStorage.removeItem("nfc-buy-now");sessionStorage.removeItem("nfc-checkout-mode");sessionStorage.removeItem("nfc-payment-request");}catch{}pendingContext.current=null;}
 async function confirmPayment(receipt:RazorpayReceipt){setStatus("Confirming your payment securely…");const result=razorpayVerificationSchema.safeParse(await jsonRequest("/api/shop/razorpay/verify",receipt));if(!result.success||result.data.orderId!==receipt.orderId)throw new Error("Payment confirmation could not be matched. Check My orders before paying again.");if(result.data.paid){clearPaidCart(pendingContext.current);setStatus("Payment confirmed. Opening your order…");}else setStatus("Your payment is being confirmed. Opening your order status…");router.push("/account/orders/"+encodeURIComponent(receipt.orderId));}
 async function retryVerification(){if(!pendingReceipt||operation.current)return;operation.current=true;markBusy(true);setError("");try{await confirmPayment(pendingReceipt);}catch(e){setError((e as Error).message);setStatus("Confirmation is still pending. Your bag is saved. Check payment status before paying again.");}finally{operation.current=false;markBusy(false);}}
 async function pay(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!enabled||!email||operation.current||pendingReceipt||attentionOrderId)return;
  setError("");
  const form=e.currentTarget;
  const f=Object.fromEntries(new FormData(form));
  const parsed=addressSchema.safeParse({...f,country:"India"});
  if(!parsed.success){setError(parsed.error.issues[0].message);return;}
  if(shipping===null||quotedPin!==parsed.data.pincode){await quote(form);return;}
  if(f.consent!=="on"){setError("Please agree to design contact and the order policies.");return;}
  operation.current=true;
  markBusy(true);
  setStatus("Preparing secure payment…");
  let receipt:RazorpayReceipt|null=null;
  let suspendedDialog:HTMLDialogElement|null=null;
  try{
   const signature=JSON.stringify({items,address:parsed.data,shipping,subtotalPaise:total,email});
   let saved;
   try{const cache=checkoutRequestCacheSchema.safeParse(JSON.parse(sessionStorage.getItem("nfc-payment-request")||"null"));if(cache.success&&cache.data.signature===signature)saved=cache.data;}catch{}
   const requestId=saved?.requestId??crypto.randomUUID();
   if(uploadedOwner.current!==email){uploadedLogos.current.clear();uploadedOwner.current=email;}
   for(const [localId,assetId] of saved?.uploads??[])uploadedLogos.current.set(localId,assetId);
   const saveRequest=()=>sessionStorage.setItem("nfc-payment-request",JSON.stringify({signature,requestId,uploads:[...uploadedLogos.current]}));
   saveRequest();
   const Constructor=await loadRazorpay();
   const mapped=[];
   for(const item of items){
    if(!item.logoId){mapped.push(item);continue;}
    const uploaded=uploadedLogos.current.get(item.logoId);
    if(uploaded){mapped.push({...item,logoId:uploaded});continue;}
    const blob=await readLogo(item.logoId);
    if(!blob)throw new Error("A logo is missing from this browser. Re-add the product with your logo.");
    const up=await jsonRequest("/api/shop/assets",{name:item.logoName||"logo.png",size:blob.size});
    const {error:upError}=await createClient().storage.from("order-logos").uploadToSignedUrl(up.path,up.token,blob,{contentType:"image/png"});
    if(upError)throw new Error("Logo upload failed. Please retry.");
    await jsonRequest("/api/shop/assets",{id:up.id},"PUT");
    uploadedLogos.current.set(item.logoId,up.id);
    saveRequest();
    mapped.push({...item,logoId:up.id});
   }
   const payment=razorpaySessionSchema.safeParse(await jsonRequest("/api/shop/checkout",{items:mapped,address:parsed.data,requestId,shippingPaise:shipping,subtotalPaise:total,consent:true}));
   if(!payment.success)throw new Error("Secure payment could not be prepared. Please try again.");
   // Razorpay attaches its iframe to the body. A native modal dialog would make it inert.
   const dialog=form.closest("dialog");
   if(dialog?.open){suspendedDialog=dialog;dialog.close();}
   setStatus("Complete your payment in the secure Razorpay window.");
   let failed="";
   receipt=await openRazorpay(Constructor,payment.data,new URL("/brand/nfc-hiy.webp",location.origin).href,message=>{failed=message;setError(message);});
   if(!receipt){setError(failed);setStatus("Payment window closed. Your bag and details are saved; you can continue when ready.");return;}
   setError("");
   const context={receipt,customerEmail:email,purchased:items.map(({id,quantity})=>({id,quantity})),buyNow:!!initialItems||sessionStorage.getItem("nfc-checkout-mode")==="buy"};
   pendingContext.current=context;
   setPendingReceipt(receipt);
   try{sessionStorage.setItem(receiptKey,JSON.stringify(context));}catch{}
   await confirmPayment(receipt);
  }catch(e){
   if(e instanceof CheckoutApiError){
    if(e.problem.code==="ORDER_ALREADY_PAID"){
     clearPaidCart({purchased:items.map(({id,quantity})=>({id,quantity})),buyNow:!!initialItems||sessionStorage.getItem("nfc-checkout-mode")==="buy"});
     setStatus("This order has already been paid. Opening your order…");
     router.push("/account/orders/"+e.problem.orderId);
     return;
    }
    if(e.problem.canRestart){
     uploadedLogos.current.clear();
     try{sessionStorage.removeItem("nfc-payment-request");}catch{}
     setError("");
     setStatus("Your previous unpaid order was cancelled. Your details are saved; continue to start a fresh checkout.");
    }else{
     setAttentionOrderId(e.problem.orderId);
     setError(e.message);
     setStatus("Please check your existing order or contact support before starting another payment.");
    }
    return;
   }
   setError((e as Error).message);
   setStatus(receipt?"Your payment was submitted. Check payment status before starting another payment.":"");
  }finally{
   operation.current=false;
   markBusy(false);
   if(suspendedDialog?.isConnected&&!suspendedDialog.open)suspendedDialog.showModal();
   requestAnimationFrame(()=>{if(form.isConnected)form.querySelector<HTMLButtonElement>(receipt?"button[type=button]:not(:disabled)":"button[type=submit]:not(:disabled)")?.focus();});
  }
 }
 if(!ready)return <p role="status">Preparing your checkout…</p>;
 if(!items.length)return <div className="shop-empty"><h2>Your bag is empty.</h2><Link className="shop-button" href="/">Find your card <ArrowRight size={16}/></Link></div>;
 return <><div className="checkout-step"><span>01 / Your products</span><span>02 / Your design</span><strong>03 / Checkout</strong></div>{!enabled&&<p className="preview-note">Online payment is currently unavailable. You can check shipping below or contact our team for assistance. No order is placed until payment is confirmed.</p>}
 <OfferNote items={items} products={products}/><div className="checkout-layout" data-clarity-mask="true"><div>{!email?<div className="auth-card" style={{margin:"0 0 25px",maxWidth:"none"}}><h2>Keep your order close.</h2><p>Sign in with Google to checkout and track your order. Your bag and logo stay saved in this browser.</p><GoogleButton next="/checkout" popup={popup}/></div>:<p>Signed in as {email}</p>}
 <form id="checkout-details" data-clarity-mask="true" onSubmit={pay} className="checkout-form"><h2 className="full">Where should we send it?</h2>
 {[["name","Full name","name"],["phone","WhatsApp number","tel"],["line1","Address","address-line1"],["line2","Apartment / landmark (optional)","address-line2"],["city","City","address-level2"],["state","State","address-level1"],["pincode","PIN code","postal-code"]].map(([name,label,auto])=><label key={name} className={name.startsWith("line")?"full":""}>{label}<input name={name} required={name!=="line2"} disabled={busy||!!pendingReceipt} autoComplete={auto} type={name==="phone"?"tel":"text"} maxLength={name==="phone"?10:name==="pincode"?6:200} inputMode={["phone","pincode"].includes(name)?"numeric":undefined} onChange={()=>{if(name==="pincode"){setShipping(null);setQuotedPin("");}}}/></label>)}
 <label>Country<input value="India" readOnly/></label><p className="full customisation-note">Our team will contact you on WhatsApp to collect your destination links and confirm your design.</p>
 <label className="consent full"><input type="checkbox" name="consent" required disabled={busy||!!pendingReceipt}/> <span>I agree to be contacted about my design and order. I have read the <Link href="/privacy">privacy information</Link>{enabled&&<> and <Link href="/policies">order policies</Link></>}.</span></label>
 <SaveCart items={items} email={email}/>
 {status&&<p className="preview-note full" role="status" aria-live="polite">{status}</p>}
 {error&&<p className="shop-error full" role="alert">{error}</p>}
 <button type="button" className="shop-button full" disabled={busy||!!pendingReceipt||total===null} onClick={e=>{if(e.currentTarget.form)void quote(e.currentTarget.form);}}>{shipping===null?"Calculate shipping":"Refresh shipping estimate"}</button>
 {attentionOrderId?<><Link className="shop-button full" href={"/account/orders/"+attentionOrderId}>Check existing order <ArrowRight size={16}/></Link><a className="plain-button full" href="https://wa.me/919109167827" target="_blank" rel="noreferrer">Contact support</a></>:pendingReceipt?<><button type="button" className="shop-button full" disabled={busy||!email} onClick={()=>void retryVerification()}>{busy?"Confirming payment…":"Check payment status"} <LockKeyhole size={16}/></button><Link className="plain-button full" href={"/account/orders/"+pendingReceipt.orderId}>View this order</Link></>:<button type="submit" className="shop-button full" disabled={!enabled||!email||busy||total===null}>{busy?"Please wait…":!enabled?"Online payment unavailable":shipping===null?"Calculate shipping":"Pay securely with Razorpay"} <LockKeyhole size={16}/></button>}</form><CartExtras products={products} onAdd={addExtra} disabled={busy||!!pendingReceipt||!!attentionOrderId||items.length>=20}/><DeliveryEstimate/></div>
 <aside className="order-summary"><h2>Your order</h2>{items.map(i=>{const p=products.find(p=>p.slug===i.productSlug);const v=p?.variants.find(v=>v.id===i.variantId);return <div key={i.id}><span>{p?.name}<br/><small>{v?.name} · Qty {i.quantity}{i.logoName?" · Logo attached":""}</small></span><strong>{priceLabel(v?.price_paise==null?null:v.price_paise*i.quantity)}</strong></div>;})}{offer.discount>0&&<div><span>Free card offer</span><strong>−{priceLabel(offer.discount)}</strong></div>}<div><span>Subtotal</span><strong>{priceLabel(total)}</strong></div><div><span>Tax (18%)</span><strong>{priceLabel(total===null?null:taxFor(total))}</strong></div><div><span>Shipping · NimbusPost</span><strong>{shipping===null?"Calculated next":priceLabel(shipping)}</strong></div><div className="checkout-total"><span>{shipping===null?"Total before shipping":"Order total"}</span><strong>{total===null?"Needs price confirmation":priceLabel(orderTotals(total,shipping??0).total)}</strong></div><p>Made to order. Design approved by you before production.</p>{onEdit?<button type="button" className="plain-button" onClick={onEdit}>Back to product</button>:<Link href="/cart" className="plain-button" onClick={()=>{sessionStorage.removeItem("nfc-checkout-mode");sessionStorage.removeItem("nfc-payment-request");}}>Edit your bag</Link>}</aside></div></>;
}
