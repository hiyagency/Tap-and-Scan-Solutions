import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopShell } from "@/components/shop/shell";
import { ProductConfigurator } from "@/components/shop/product-configurator";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { getSiteUrl } from "@/lib/site-url";
import { CatalogueGrid } from "@/components/shop/catalogue-grid";
import { customerSession } from "@/lib/shop/server";
import { checkoutReady } from "@/lib/shop/readiness";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const {products}=await getCatalogue();const p=products.find(p=>p.slug===slug);return {title:p?.name||"Product not found",description:p?.description,alternates:{canonical:`/products/${slug}`},openGraph:{images:p?[p.variants[0].image]:[]}};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const {products}=await getCatalogue();const product=products.find(p=>p.slug===slug&&p.active);if(!product)notFound();const json={"@context":"https://schema.org","@type":"Product",name:product.name,description:product.description,image:product.variants.map(v=>getSiteUrl()+v.image),brand:{"@type":"Brand",name:"NFC.HIY"}};
 const user=await customerSession();
 return <ShopShell><main id="shop-main" className="shop-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Shop</Link><span>/</span><span>{product.name}</span></nav><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,"\\u003c")}}/><ProductConfigurator product={product} products={products} email={user?.email||null} enabled={checkoutReady()}/><div className="related-products"><h2>More ways to connect.</h2><CatalogueGrid products={products.filter(p=>p.active&&p.slug!==slug)}/></div></main></ShopShell>;
}
