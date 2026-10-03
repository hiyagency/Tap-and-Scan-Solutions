import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { orderTotals, taxFor } from "./totals";
import { selectRate } from "./nimbuspost";
import { catalogue, standee } from "./catalogue";
import { parcelForItems } from "./parcel";
describe("Card pricing and tax", () => {
  it("prices all eight card variants at 299 rupees", () => {
    expect(catalogue.flatMap(p => p.variants)).toHaveLength(8);
    expect(catalogue.every(p => p.variants.every(v => v.price_paise === 29900))).toBe(true);
  });
  it("adds mandatory tax and quoted shipping in integer paise", () => {
    expect(orderTotals(29900,5000)).toEqual({subtotal:29900,tax:5382,shipping:5000,total:40282});
    expect(orderTotals(59800,6000).total).toBe(76564);
    expect(taxFor(101)).toBe(18);
    expect(() => orderTotals(29900,-1)).toThrow();
    expect(() => taxFor(NaN)).toThrow();
  });
  it("lists the standee at 1299 rupees before GST with its confirmed outer parcel", () => {
    expect(standee.variants[0].price_paise).toBe(129900);
    expect(standee.stock).toBe(10);
    expect(orderTotals(129900,5000)).toEqual({subtotal:129900,tax:23382,shipping:5000,total:158282});
    expect(parcelForItems([{id:"s",productSlug:standee.slug,variantId:standee.variants[0].id,quantity:1}], [standee])).toEqual({length:18,width:13,height:5,weight:0.65});
  });
});
describe("NimbusPost rates", () => {
  it("uses the cheapest valid total or configured carrier", () => {
    const rates=[{courierId:"1",courierName:"Courier A",result:{totalPaise:7552}},{courierId:"2",courierName:"Courier B",result:{totalPaise:6136}}];
    expect(selectRate(rates).amount).toBe(6136);
    expect(selectRate(rates,"1").amount).toBe(7552);
  });
  it("does not silently turn missing or invalid quotes into free shipping", () => {
    for(const rates of [[],null,...[null,0,-5,1.2,"5000",Infinity].map(totalPaise=>[{courierId:"1",courierName:"X",result:{totalPaise}}])]) expect(()=>selectRate(rates)).toThrow();
  });
});
