import type { Product } from "./catalogue";
import type { CartItem } from "./validation";

/** Inventory is shared across all variants and separately customised cart lines. */
export function productQuantity(items: CartItem[], slug: string) {
  return items.filter(item => item.productSlug === slug).reduce((sum, item) => sum + item.quantity, 0);
}

export function cartIssues(items: CartItem[], products: Product[]) {
  const issues: string[] = [];
  for (const slug of new Set(items.map(item => item.productSlug))) {
    const product = products.find(product => product.slug === slug);
    if (!product || !product.active) {
      issues.push(`${product?.name ?? "An item"} is no longer available. Remove it to continue.`);
      continue;
    }
    if (product.stock !== undefined && productQuantity(items, slug) > product.stock) {
      issues.push(`${product.name}: ${product.stock} available across all designs. Update your quantities.`);
    }
    for (const item of items.filter(item => item.productSlug === slug)) {
      const variant = product.variants.find(variant => variant.id === item.variantId);
      if (!variant?.available) issues.push(`${product.name}: this design is unavailable. Remove it to continue.`);
      else if (variant.price_paise === null) issues.push(`${product.name}: contact our team for a price before checkout.`);
    }
  }
  return [...new Set(issues)];
}
