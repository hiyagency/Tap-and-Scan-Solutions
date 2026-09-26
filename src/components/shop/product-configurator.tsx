"use client";
import { useRef,useState } from "react";
import type { CartItem } from "@/lib/shop/validation";
import { CheckoutDialog } from "./checkout-dialog";
import { ArrowRight, Check, Upload, ShoppingBag, ShieldCheck } from "lucide-react";
import { type Product,priceLabel } from "@/lib/shop/catalogue";
import { validPng } from "@/lib/shop/validation";
import { addToCart, saveLogo } from "@/lib/shop/cart";
import { ProductMedia } from "./product-media";
import { NFCCreationProcess } from "./nfc-creation-process";
export function ProductConfigurator({product,products,email,enabled}:{product:Product;products:Product[];email:string|null;enabled:boolean}){
 const buyButton=useRef<HTMLButtonElement>(null);
 const [checkout,setCheckout]=useState<CartItem[]|null>(null);const [variantId,setVariant]=useState(product.variants[0].id);const [qty,setQty]=useState(1);const [file,setFile]=useState<File|null>(null);const [error,setError]=useState("");const [added,setAdded]=useState(false);const [busy,setBusy]=useState(false);
 const variant=product.variants.find(v=>v.id===variantId)!;
 async function chooseLogo(f:File|undefined){setError("");setFile(null);if(!f)return;if(f.size>10*1024*1024||!validPng(new Uint8Array(await f.slice(0,8).arrayBuffer()))){setError("Please choose a PNG image under 10 MB.");return;}setFile(f);}
 async function add(buy:boolean){setBusy(true);setError("");try{const logoId=file?crypto.randomUUID():null;if(file&&logoId)await saveLogo(logoId,file);const item={id:crypto.randomUUID(),productSlug:product.slug,variantId,quantity:qty,logoId,logoName:file?.name};if(buy){sessionStorage.setItem("nfc-buy-now",JSON.stringify([item]));sessionStorage.setItem("nfc-checkout-mode","buy");setCheckout([item]);}else{addToCart(item);setAdded(true);}}catch(e){setError(e instanceof Error?e.message:"Could not save your bag. Please retry.");}finally{setBusy(false);}}
 return <div className="product-detail"><ProductMedia key={variant.id} variant={variant} name={product.name} isKeychain={product.kind==="keychain"}/><div className="product-config"><p className="shop-eyebrow">{product.platform} / {product.qr===false?"NFC":"NFC + QR"}</p><h1>{product.name}</h1><p className="product-description">{product.description}</p><strong className="product-price">{priceLabel(variant.price_paise)}</strong>{variant.price_paise===null&&<p className="muted">Launch preview · Pricing coming soon</p>}
 {variant.price_paise!==null&&<p className="muted">List price · +18% tax. NimbusPost shipping calculated at checkout.</p>}
 {product.variants.length>1&&<fieldset className="variant-options"><legend>Choose your design</legend>{product.variants.map(v=><button type="button" key={v.id} aria-pressed={variantId===v.id} onClick={()=>{setVariant(v.id);setAdded(false);}}>{v.name}</button>)}</fieldset>}
 <div className="configuration-row"><label htmlFor="quantity">Quantity</label><input id="quantity" type="number" min={1} max={50} value={qty} onChange={e=>setQty(Math.max(1,Math.min(50,Number(e.target.value)||1)))}/></div>
 {product.customLogo!==false&&<label className="logo-upload"><Upload size={20}/><span><strong>{file?file.name:"Make it yours. Add your logo."}</strong><small>Optional · PNG only · Up to 10 MB</small></span><input aria-label="Upload your PNG logo" type="file" accept="image/png,.png" onChange={e=>chooseLogo(e.target.files?.[0])}/></label>}{file&&<button className="plain-button" onClick={()=>setFile(null)}>Remove logo</button>}
 <p className="customisation-note">{product.kind==="keychain"?"Our team will contact you on WhatsApp to confirm your link and setup requirements before dispatch.":"Our team will message you on WhatsApp to collect your links and confirm the design before production."}</p>
 {error&&<p role="alert" className="shop-error">{error}</p>}
 <div className="purchase-actions"><button ref={buyButton} className="shop-button" disabled={busy||!variant.available||!product.active} onClick={()=>add(true)}>Buy now <ArrowRight size={18}/></button><button className="shop-button secondary" disabled={busy||!variant.available||!product.active} onClick={()=>add(false)}>{added?<Check size={18}/>:<ShoppingBag size={18}/>} {added?"Added to bag":"Add to bag"}</button></div>
 {added&&<p role="status">Added. <a href="/cart">View your bag →</a></p>}{!variant.available&&<p>Currently unavailable.</p>}
 <p className="product-assurance"><ShieldCheck size={17}/> {product.kind==="keychain"?"Setup confirmation before dispatch":"Design approval before production"}</p>
 {[["Technical specifications",product.specifications],["Materials",product.materials],["How to use",product.instructions]].filter(([,v])=>v).map(([title,value])=><details key={title}><summary>{title}</summary><p>{value}</p></details>)}
 </div>{product.kind!=="keychain"&&<NFCCreationProcess key={variant.id} productImage={variant.image} productName={product.name}/ >}{checkout&&<CheckoutDialog items={checkout} products={products} email={email} enabled={enabled} onClose={()=>{setCheckout(null);requestAnimationFrame(()=>buyButton.current?.focus());}}/>}</div>;
}
