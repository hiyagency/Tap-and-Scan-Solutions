import type { Product } from './catalogue';
import type { CartItem } from './validation';
export function checkStock(items:CartItem[],products:Product[]){
 const quantities=new Map<string,number>();
 for(const item of items) quantities.set(item.productSlug,(quantities.get(item.productSlug)||0)+item.quantity);
 for(const [slug,quantity] of quantities){const p=products.find(p=>p.slug===slug);if(p?.stock!==undefined&&quantity>p.stock)throw new Error(`${p.name}: only ${p.stock} in stock. Reduce your quantity.`);}
}
