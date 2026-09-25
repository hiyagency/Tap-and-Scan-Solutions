import { ShopShell } from "@/components/shop/shell";
import { Checkout } from "@/components/shop/checkout";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { customerSession } from "@/lib/shop/server";
import { checkoutReady } from "@/lib/shop/readiness";
export const metadata={title:"Checkout",robots:{index:false,follow:false}};
export default async function CheckoutPage(){const [{products,connected},user]=await Promise.all([getCatalogue(),customerSession()]);return <ShopShell><main id="shop-main" className="shop-page"><p className="shop-eyebrow">ALMOST CONNECTED</p><h1 className="shop-page-title">Make it yours.</h1><Checkout products={products} email={user?.email||null} enabled={connected&&checkoutReady()}/></main></ShopShell>;}

