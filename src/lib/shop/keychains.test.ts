import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { keychains } from "./keychains";
import { catalogue } from "./catalogue";

describe("imported keychains", () => {
  it("adds four distinct products without changing card IDs", () => {
    expect(keychains).toHaveLength(4);
    const all = [...catalogue, ...keychains];
    expect(new Set(all.map(p => p.slug)).size).toBe(all.length);
  });
  it("keeps prices unset, photos present and card-only options disabled", () => {
    for (const p of keychains) {
      expect(p.kind).toBe("keychain");
      expect(p.customLogo).toBe(false);
      expect(p.qr).toBe(false);
      for (const v of p.variants) {
        expect(v.price_paise).toBeNull();
        expect(v.video).toBe("");
        expect(existsSync("public" + v.image)).toBe(true);
      }
    }
  });
});
