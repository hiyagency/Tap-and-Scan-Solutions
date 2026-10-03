import { describe, expect, it } from "vitest";
import { catalogue } from "./catalogue";
import { cartIssues, productQuantity } from "./cart-state";
const product={...catalogue[3],stock:3};
const items=product.variants.map((variant,index)=>({id:String(index),productSlug:product.slug,variantId:variant.id,quantity:2}));
describe("cart purchase readiness",()=>{
 it("counts shared inventory across variants",()=>expect(productQuantity(items,product.slug)).toBe(4));
 it("blocks quantities above shared stock",()=>expect(cartIssues(items,[product])).toHaveLength(1));
 it("allows the exact remaining stock",()=>expect(cartIssues([{...items[0],quantity:3}],[product])).toEqual([]));
 it("blocks unavailable products",()=>expect(cartIssues(items,[{...product,active:false}])[0]).toContain("no longer available"));
 it("blocks removed products",()=>expect(cartIssues(items,[])).toHaveLength(1));
 it("blocks an unavailable design",()=>expect(cartIssues([items[0]],[{...product,variants:product.variants.map(v=>({...v,available:false}))}])[0]).toContain("design is unavailable"));
 it("does not treat a missing price as free",()=>expect(cartIssues([items[0]],[{...product,variants:product.variants.map(v=>({...v,price_paise:null}))}])[0]).toContain("price before checkout"));
 it("does not invent stock when quantity is unknown",()=>expect(cartIssues(items,[{...product,stock:undefined}])).toEqual([]));
});
