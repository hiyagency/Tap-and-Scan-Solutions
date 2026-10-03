import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogue } from "./catalogue";
afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});
describe("shared offer configuration",()=>{
 it("turns off discount and eligibility together",async()=>{
  vi.stubEnv("NEXT_PUBLIC_CARD_OFFER_ENABLED","false");vi.resetModules();
  const {CARD_OFFER,cardOffer,isOfferCard}=await import("./offers");
  expect(CARD_OFFER.enabled).toBe(false);
  expect(isOfferCard("google-reviews")).toBe(false);
  expect(cardOffer([{id:"one",productSlug:"google-reviews",variantId:"google-reviews",quantity:3}],catalogue).discount).toBe(0);
  const {visibleShopFaq}=await import("./faq");
  expect(visibleShopFaq.some(([question])=>question.includes("free-card"))).toBe(false);
 });
 it("preserves the configured three-card offer when enabled",async()=>{
  vi.stubEnv("NEXT_PUBLIC_CARD_OFFER_ENABLED","true");vi.resetModules();
  const {cardOffer,isOfferCard}=await import("./offers");
  expect(isOfferCard("google-reviews")).toBe(true);
  expect(isOfferCard("google-review-keyring")).toBe(false);
  expect(cardOffer([{id:"one",productSlug:"google-reviews",variantId:"google-reviews",quantity:3}],catalogue).discount).toBe(29900);
 });
});
