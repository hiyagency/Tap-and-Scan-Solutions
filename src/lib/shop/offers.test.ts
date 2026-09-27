import { describe,it,expect } from "vitest";
import { catalogue } from "./catalogue";
import { priceItems } from "./pricing";
import { safeCustomerNext } from "./auth-next";
const card=(quantity:number)=>({id:"card",productSlug:"google-reviews",variantId:"google-reviews",quantity});
describe("Buy two get one card offer",()=>{
 it("charges two cards for three and four cards for six",()=>{
  expect(priceItems([card(3)],catalogue)).toMatchObject({subtotal:59800,quantity:3,discount:29900});
  expect(priceItems([card(6)],catalogue)).toMatchObject({subtotal:119600,quantity:6,discount:59800});
 });
 it("does not discount fewer than three cards",()=>expect(priceItems([card(2)],catalogue).discount).toBe(0));
 it("keeps every free unit and logo in order rows",()=>{
  const result=priceItems([{...card(3),logoId:"asset"}],catalogue);
  expect(result.rows.reduce((sum,row)=>sum+row.quantity,0)).toBe(3);
  expect(result.rows.find(row=>row.price_paise===0)?.asset_id).toBe("asset");
 });
 it("rejects duplicate identifiers",()=>expect(()=>priceItems([card(2),card(1)],catalogue)).toThrow("Duplicate"));
});
describe("Customer return URLs",()=>{
 it("allows only local checkout and product destinations",()=>{
  expect(safeCustomerNext("/products/whatsapp")).toBe("/products/whatsapp");
  for(const value of ["https://evil.example","//evil.example","/admin","/products/../admin",null])expect(safeCustomerNext(value)).toBe("/account/orders");
 });
});
