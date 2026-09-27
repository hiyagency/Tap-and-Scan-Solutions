import type { Product } from "./catalogue";
import type { CartItem } from "./validation";
import { cardOffer } from "./offers";
import { checkStock } from './inventory';
export function priceItems(items:CartItem[],products:Product[]){
 checkStock(items,products);
 if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error("Duplicate cart items.");
 const offer=cardOffer(items,products);
 let subtotal=0,quantity=0;
 const rows=items.flatMap(i=>{
  const p=products.find(p=>p.slug===i.productSlug&&p.active);
  const v=p?.variants.find(v=>v.id===i.variantId&&v.available);
  if(!p||!v)throw new Error("An item in your bag is no longer available.");
  if(v.price_paise===null||!Number.isSafeInteger(v.price_paise)||v.price_paise<=0)throw new Error("Pricing is not available yet.");
  if(!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>50)throw new Error("Invalid quantity.");
  const free=offer.freeByItem[i.id]||0,paid=i.quantity-free;
  subtotal+=v.price_paise*paid;quantity+=i.quantity;
  const row={product_slug:p.slug,variant_id:v.id,name:p.name,variant_name:v.name,image:v.image,quantity:paid,price_paise:v.price_paise,asset_id:i.logoId||null};
  return [...(paid?[row]:[]),...(free?[{...row,quantity:free,price_paise:0,variant_name:v.name+" · Free with card offer"}]:[])];
 });
 if(!Number.isSafeInteger(subtotal)||subtotal<=0)throw new Error("Invalid order total.");
 return {rows,subtotal,quantity,discount:offer.discount};
}

