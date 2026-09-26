import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { orderTotals, taxFor } from "./totals";
import { selectRate } from "./nimbuspost";
import { catalogue } from "./catalogue";
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
