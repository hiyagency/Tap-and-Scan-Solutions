import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { keychains } from "./keychains";
import { catalogue } from "./catalogue";
import { priceItems } from "./pricing";
import { orderTotals } from "./totals";

describe("imported keychains", () => {
  it("adds four distinct products without changing card IDs", () => {
    expect(keychains).toHaveLength(4);
    const all = [...catalogue, ...keychains];
    expect(new Set(all.map(p => p.slug)).size).toBe(all.length);
  });
  it("prices keychains at 249 rupees with photos and card-only options disabled", () => {
    for (const p of keychains) {
      expect(p.kind).toBe("keychain");
      expect(p.customLogo).toBe(false);
      expect(p.qr).toBe(false);
      for (const v of p.variants) {
        expect(v.price_paise).toBe(24900);
        expect(v.video).toBe("");
        expect(existsSync("public" + v.image)).toBe(true);
      }
    }
  });
  it("charges keychains before GST without including them in the free-card offer", () => {
    const p = keychains[0];
    const priced = priceItems([{id:"keychains",productSlug:p.slug,variantId:p.variants[0].id,quantity:3}],keychains);
    expect(priced.subtotal).toBe(74700);
    expect(priced.discount).toBe(0);
    expect(orderTotals(priced.subtotal,5000)).toEqual({subtotal:74700,tax:13446,shipping:5000,total:93146});
  });
});
