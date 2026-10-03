import type { Product } from "./catalogue";
import type { CartItem } from "./validation";

const eligibleCards = new Set(["google-reviews","instagram","whatsapp","multi-link","linkedin","zomato","facebook"]);
// Build-time switch shared by the server calculation and all offer surfaces.
// After changing this public, non-secret setting, redeploy both server and client.
export const CARD_OFFER = {
  enabled: process.env.NEXT_PUBLIC_CARD_OFFER_ENABLED !== "false",
  bundleSize: 3,
  title: "Buy 2 NFC cards, get 1 free",
  description: "Add 3 eligible cards. The lowest-priced card is free in each set of 3.",
};
export const isOfferCard = (slug: string) => CARD_OFFER.enabled && eligibleCards.has(slug);
export function cardOffer(items: CartItem[], products: Product[]) {
  const units: { itemId: string; price: number }[] = [];
  for (const item of items) {
    const p = products.find(p => p.slug === item.productSlug && p.active);
    const v = p?.variants.find(v => v.id === item.variantId && v.available);
    if (!p || !isOfferCard(p.slug) || !v?.price_paise || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) continue;
    for (let n=0;n<item.quantity;n++) units.push({itemId:item.id,price:v.price_paise});
  }
  const freeCount = Math.floor(units.length / CARD_OFFER.bundleSize);
  const freeByItem: Record<string, number> = {};
  let discount = 0;
  for (const unit of units.sort((a,b)=>a.price-b.price).slice(0,freeCount)) {
    freeByItem[unit.itemId] = (freeByItem[unit.itemId] || 0) + 1;
    discount += unit.price;
  }
  return { discount, freeCount, freeByItem, cardCount: units.length, toNext: CARD_OFFER.bundleSize - units.length % CARD_OFFER.bundleSize };
}
