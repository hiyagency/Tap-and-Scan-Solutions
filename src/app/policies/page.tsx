import { ShopShell } from "@/components/shop/shell";
export const metadata={title:"Order policies",alternates:{canonical:"/policies"}};
export default function Policies(){return <ShopShell><main className="shop-page" id="shop-main"><h1 className="shop-page-title">Order policies.</h1>{process.env.SHIPPING_POLICY&&process.env.REFUND_POLICY?<><h2>Shipping</h2><p style={{whiteSpace:"pre-wrap"}}>{process.env.SHIPPING_POLICY}</p><h2>Returns, cancellations & refunds</h2><p style={{whiteSpace:"pre-wrap"}}>{process.env.REFUND_POLICY}</p></>:<p className="preview-note">Shipping, cancellation and refund terms will be published before checkout opens. No paid orders are currently being accepted.</p>}</main></ShopShell>;}

