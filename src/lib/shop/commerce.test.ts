import { describe,it,expect } from "vitest";
import { catalogue } from "./catalogue";
import { priceItems } from "./pricing";
import { validPng,addressSchema,nextStage } from "./validation";
import { payuRequestHash,payuResponseHash,validPayuHash,amountToPaise } from "./payu-hash";
import { createHash } from "node:crypto";
const item={id:"00000000-0000-4000-8000-000000000001",productSlug:"multi-link",variantId:"multi-link-classic",quantity:2};
describe("Commerce boundaries",()=>{
 it("never prices a placeholder, unavailable variant or unknown product",()=>{expect(()=>priceItems([item],catalogue)).toThrow("Pricing");expect(()=>priceItems([{...item,variantId:"invalid"}],catalogue)).toThrow("available");expect(()=>priceItems([{...item,quantity:0}],catalogue)).toThrow();});
 it("uses the selected variant's server price, ignoring untrusted client fields",()=>{const products=structuredClone(catalogue);const p=products.find(p=>p.slug==="multi-link")!;p.variants[0].price_paise=12000;p.variants[1].price_paise=20000;const result=priceItems([item,{...item,variantId:"multi-link-custom",quantity:1}],products);expect(result.subtotal).toBe(44000);expect(result.quantity).toBe(3);p.variants[0].available=false;expect(()=>priceItems([item],products)).toThrow();});
 it("validates the PNG signature and Indian address",()=>{expect(validPng(new Uint8Array([137,80,78,71,13,10,26,10]))).toBe(true);expect(validPng(new Uint8Array([255,216,255,0]))).toBe(false);expect(addressSchema.safeParse({name:"Buyer",phone:"123",line1:"Address",city:"Delhi",state:"Delhi",pincode:"000000",country:"India"}).success).toBe(false);});
 it("does not skip design approval or allow shipping through a normal status edit",()=>{expect(nextStage("awaiting_design","design_approved")).toBe(true);expect(nextStage("awaiting_payment","awaiting_design")).toBe(false);expect(nextStage("awaiting_design","shipped")).toBe(false);expect(nextStage("ready_to_ship","shipped")).toBe(false);});
});
describe("PayU integrity",()=>{
 const fields={key:"merchant",txnid:"txn123",amount:"120.50",productinfo:"NFC card",firstname:"Buyer",email:"buyer@example.test",status:"success",udf1:"order123"};
 it("matches the documented request hash sequence",()=>{const expected=createHash("sha512").update("merchant|txn123|120.50|NFC card|Buyer|buyer@example.test|order123||||||||||salt").digest("hex");expect(payuRequestHash(fields,"salt")).toBe(expected);});
 it("rejects a changed amount, forged signature and supports additional charges",()=>{const signed={...fields,hash:payuResponseHash(fields,"salt")};expect(validPayuHash(signed,"salt")).toBe(true);expect(validPayuHash({...signed,amount:"1.00"},"salt")).toBe(false);expect(validPayuHash({...signed,hash:"fake"},"salt")).toBe(false);const extra={...fields,additionalCharges:"2.00"};expect(validPayuHash({...extra,hash:payuResponseHash(extra,"salt")},"salt")).toBe(true);});
 it("converts exact decimal rupees to paise without floating point rounding",()=>{expect(amountToPaise("120.50")).toBe(12050);expect(amountToPaise("0.29")).toBe(29);expect(()=>amountToPaise("-1")).toThrow();expect(()=>amountToPaise("12.345")).toThrow();});
});

