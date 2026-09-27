import { z } from "zod";
import type { Product } from "./catalogue";
import type { CartItem } from "./validation";

export const shippingSpecSchema = z.object({
  weightGrams: z.number().int().min(1).max(30000),
  lengthCm: z.number().positive().max(150),
  widthCm: z.number().positive().max(150),
  heightCm: z.number().positive().max(150),
});
export type ShippingSpec = z.infer<typeof shippingSpecSchema>;

// Packed units are stacked upright into one parcel. Include all packaging in
// each unit's measurements. Never accept dimensions or weights from checkout.
export function parcelForItems(items: CartItem[], products: Product[]) {
  let grams = 0, length = 0, width = 0, height = 0;
  if (!items.length) throw new Error("Your bag is empty.");
  for (const item of items) {
    const product = products.find(p => p.slug === item.productSlug && p.active);
    if (!product || !product.variants.some(v => v.id === item.variantId && v.available)) throw new Error("An item is no longer available.");
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) throw new Error("Invalid quantity.");
    const parsed = shippingSpecSchema.safeParse(product.shipping);
    if (!parsed.success) throw new Error("Shipping measurements for " + product.name + " are awaiting confirmation. Please contact our team.");
    const s = parsed.data;
    grams += s.weightGrams * item.quantity;
    length = Math.max(length, s.lengthCm);
    width = Math.max(width, s.widthCm);
    height += s.heightCm * item.quantity;
  }
  if (grams > 30000 || height > 150) throw new Error("This order needs a custom shipping quote. Please contact our team.");
  return { length, width, height: Math.round(height * 100) / 100, weight: grams / 1000 };
}
