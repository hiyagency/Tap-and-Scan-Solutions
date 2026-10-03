import { Nfc, Truck, MessageCircle, Check, CircleAlert } from "lucide-react";
import type { Product } from "@/lib/shop/catalogue";
export function PurchaseConfidenceGrid({product,variantAvailable=true}:{product:Product;variantAvailable?:boolean}){
 const stock=product.stock;const available=product.active&&variantAvailable&&stock!==0;
 return <section className="purchase-confidence" aria-label="Purchase information">
 <div data-state={!available?"unavailable":stock!==undefined&&stock<=5?"low":"available"}>{available?<Check size={19}/>:<CircleAlert size={19}/>}<span><small>AVAILABILITY</small><strong>{!available?"Currently unavailable":stock===undefined?"Available":stock<=5?`Only ${stock} left`:"In stock"}</strong></span></div>
 <div><Truck size={19}/><span><small>SHIPPING</small><strong>{product.shipping?"Calculated for your PIN":"Confirm with our team"}</strong><span>{product.shipping?"Rate shown at checkout.":"Parcel details needed for a quote."}</span></span></div>
 <div><Nfc size={19}/><span><small>COMPATIBILITY</small><strong>NFC-enabled phones</strong><span>{product.qr===false?"Check your phone’s NFC support.":"Or scan the QR with your camera."}</span></span></div>
 <div><MessageCircle size={19}/><span><small>PERSONAL SETUP</small><strong>Confirmed with you</strong><span>Our team connects on WhatsApp.</span></span></div>
 </section>;
}
