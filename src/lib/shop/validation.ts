import { z } from "zod";
export const cartItemSchema = z.object({id:z.string().uuid(),productSlug:z.string().min(1).max(80),variantId:z.string().min(1).max(80),quantity:z.number().int().min(1).max(50),logoId:z.string().uuid().nullable().optional(),logoName:z.string().max(200).optional()});
export const addressSchema = z.object({name:z.string().trim().min(2).max(100),phone:z.string().regex(/^[6-9]\d{9}$/,"Enter a 10-digit Indian mobile number"),line1:z.string().trim().min(5).max(200),line2:z.string().trim().max(200).default(""),city:z.string().trim().min(2).max(80),state:z.string().trim().min(2).max(80),pincode:z.string().regex(/^[1-9]\d{5}$/,"Enter a 6-digit PIN code"),country:z.literal("India")});
export const checkoutSchema=z.object({items:z.array(cartItemSchema).min(1).max(20),address:addressSchema,requestId:z.string().uuid(),shippingPaise:z.number().int().nonnegative(),subtotalPaise:z.number().int().positive(),consent:z.literal(true)});
export type CartItem=z.infer<typeof cartItemSchema>;
export type Address=z.infer<typeof addressSchema>;
export function validPng(bytes:Uint8Array){return bytes.length>=8 && [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);}
export const stages=["awaiting_payment","awaiting_design","design_approved","production","ready_to_ship","shipped","delivered"] as const;
export function nextStage(current:string,next:string){return stages.indexOf(next as typeof stages[number])===stages.indexOf(current as typeof stages[number])+1 && current!=="awaiting_payment" && current!=="ready_to_ship";}
