import type { Product } from "./catalogue";
import type { CartItem } from "./validation";

const eligibleCards = new Set(["google-reviews","instagram","whatsapp","multi-link","linkedin","zomato","facebook"]);
export function cardOffer(items: CartItem[], products: Product[]) {
  const units: { itemId: string; price: number }[] = [];
  for (const item of items) {
    const p = products.find(p => p.slug === item.productSlug && p.active);
    const v = p?.variants.find(v => v.id === item.variantId && v.available);
    if (!p || !eligibleCards.has(p.slug) || !v?.price_paise || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) continue;
    for (let n=0;n<item.quantity;n++) units.push({itemId:item.id,price:v.price_paise});
  }
  const freeCount = Math.floor(units.length / 3);
  const freeByItem: Record<string, number> = {};
  let discount = 0;
  for (const unit of units.sort((a,b)=>a.price-b.price).slice(0,freeCount)) {
    freeByItem[unit.itemId] = (freeByItem[unit.itemId] || 0) + 1;
    discount += unit.price;
  }
  return { discount, freeCount, freeByItem, cardCount: units.length, toNext: 3 - units.length % 3 };
}
