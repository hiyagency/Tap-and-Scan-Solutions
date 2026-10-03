import { describe, expect, it } from "vitest";
import { savedCartSchema } from "./validation";

const item={id:"11111111-1111-4111-8111-111111111111",productSlug:"whatsapp",variantId:"classic",quantity:2};
const valid={name:"Test Customer",phone:"9876543210",consent:true,items:[item]};
describe("saved cart validation",()=>{
 it("accepts a contactable cart",()=>expect(savedCartSchema.safeParse(valid).success).toBe(true));
 it("requires explicit permission",()=>expect(savedCartSchema.safeParse({...valid,consent:false}).success).toBe(false));
 it("rejects invalid phone numbers",()=>expect(savedCartSchema.safeParse({...valid,phone:"123"}).success).toBe(false));
 it("rejects empty carts",()=>expect(savedCartSchema.safeParse({...valid,items:[]}).success).toBe(false));
 it("rejects invalid quantities",()=>expect(savedCartSchema.safeParse({...valid,items:[{...item,quantity:-1}]}).success).toBe(false));
 it("bounds cart size",()=>expect(savedCartSchema.safeParse({...valid,items:Array(21).fill(item)}).success).toBe(false));
});
