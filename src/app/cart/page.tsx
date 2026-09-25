import { ShopShell } from "@/components/shop/shell";
import { CartView } from "@/components/shop/cart-view";
import { getCatalogue } from "@/lib/shop/catalogue-server";
export const revalidate=60;
export const metadata={title:"Your bag",robots:{index:false,follow:false}};
export default async function CartPage(){const {products}=await getCatalogue();return <ShopShell><main id="shop-main" className="shop-page"><p className="shop-eyebrow">YOUR COLLECTION</p><h1 className="shop-page-title">Good connections, in the bag.</h1><CartView products={products}/></main></ShopShell>;}
