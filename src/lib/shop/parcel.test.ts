import { describe, it, expect } from "vitest";
import { parcelForItems, shippingSpecSchema } from "./parcel";
import { catalogue } from "./catalogue";
import { keychains } from "./keychains";
import { standee } from "./catalogue";
import type { CartItem } from "./validation";
const item = (slug:string,variantId:string,quantity=1):CartItem => ({id:"test",productSlug:slug,variantId,quantity});
describe("Catalogue-based parcel calculation",()=>{
 it("combines different product weights and quantities using server catalogue values",()=>{
  const products=catalogue.slice(0,2).map((p,i)=>({...p,shipping:{weightGrams:i?500:100,lengthCm:i?20:10,widthCm:10,heightCm:i?5:1}}));
  expect(parcelForItems([item("google-reviews","google-reviews",2),item("instagram","instagram")],products)).toEqual({weight:0.7,length:20,width:10,height:7});
 });
 it("blocks missing measurements, unavailable products and excessive parcels",()=>{
  expect(()=>parcelForItems([item("google-reviews","google-reviews")],catalogue.map(p=>({...p,shipping:undefined})))).toThrow("awaiting confirmation");
  expect(()=>parcelForItems([],catalogue)).toThrow();
  expect(()=>parcelForItems([item("unknown","unknown")],catalogue)).toThrow();
  const products=[{...catalogue[0],shipping:{weightGrams:1000,lengthCm:10,widthCm:10,heightCm:10}}];
  expect(()=>parcelForItems([item("google-reviews","google-reviews",50)],products)).toThrow("custom shipping");
 });
 it("rejects invalid owner-entered measurements",()=>{
  for(const weightGrams of [0,-1,NaN,1.5,30001])expect(shippingSpecSchema.safeParse({weightGrams,lengthCm:10,widthCm:10,heightCm:1}).success).toBe(false);
 });
 it("uses confirmed card packaging while blocking unconfirmed keychain and stand packages",()=>{
  expect(parcelForItems([item("google-reviews","google-reviews",3)],catalogue)).toEqual({weight:0.75,length:9.2,width:6.2,height:4.2});
  for(const product of [keychains[0],standee])expect(()=>parcelForItems([item(product.slug,product.variants[0].id)],[{...product,shipping:undefined}])).toThrow("awaiting confirmation");
 });
 it("rounds fractional package measurements upward rather than understating volume",()=>{
  const products=[{...catalogue[0],shipping:{weightGrams:250,lengthCm:9.201,widthCm:6.201,heightCm:1.401}}];
  expect(parcelForItems([item("google-reviews","google-reviews",2)],products)).toEqual({weight:0.5,length:9.21,width:6.21,height:2.81});
 });
 it("combines confirmed standee and card packaging without using display dimensions",()=>{
  expect(parcelForItems([item(standee.slug,standee.variants[0].id),item("google-reviews","google-reviews")],[standee,...catalogue])).toEqual({length:18,width:13,height:6.4,weight:0.9});
 });
});
