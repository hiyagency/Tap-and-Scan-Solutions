import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { createAdminClient } = vi.hoisted(() => ({createAdminClient:vi.fn()}));
vi.mock("@/lib/supabase/admin", () => ({createAdminClient}));
import { getCatalogue } from "./catalogue-server";
import { catalogue, standee } from "./catalogue";
import { keychains } from "./keychains";

describe("saved catalogue prices", () => {
  beforeEach(() => createAdminClient.mockReset());
  it("fills old placeholder prices using each product's published price", async () => {
    const products = [keychains[0],catalogue[0],standee].map(p=>({...structuredClone(p),variants:p.variants.map(v=>({...v,price_paise:null}))}));
    createAdminClient.mockReturnValue({from:()=>({select:()=>({order:()=>({abortSignal:async()=>({data:products.map(data=>({data,stock:10})),error:null})})})})});
    const result = await getCatalogue();
    expect(result.connected).toBe(true);
    expect(result.products.slice(0,3).map(p=>p.variants[0].price_paise)).toEqual([24900,29900,129900]);
    expect(result.products.slice(0,3).every(p=>p.stock===10)).toBe(true);
  });
  it("preserves explicit admin prices and does not price unknown variants", async () => {
    const data={...structuredClone(keychains[0]),variants:[{...keychains[0].variants[0],price_paise:34900},{...keychains[0].variants[0],id:"future-design",price_paise:null}]};
    createAdminClient.mockReturnValue({from:()=>({select:()=>({order:()=>({abortSignal:async()=>({data:[{data,stock:4}],error:null})})})})});
    const result = await getCatalogue();
    expect(result.products[0].variants.map(v=>v.price_paise)).toEqual([34900,null]);
    expect(result.products[0].stock).toBe(4);
  });
});
