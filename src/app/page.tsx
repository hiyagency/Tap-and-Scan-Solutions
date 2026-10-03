import type { Metadata } from "next";
import { ShopShell } from "@/components/shop/shell";
import { PremiumHome } from "@/components/shop/premium-home";
import { featuredReviews } from "@/lib/shop/reviews";
import { getCatalogue } from "@/lib/shop/catalogue-server";
export const revalidate=60;
export const metadata:Metadata={title:"Shop NFC Cards & Smart QR Products in India",description:"Find your connection. Shop custom NFC and QR cards for Google reviews, Instagram, WhatsApp, LinkedIn and more.",alternates:{canonical:"/"}};
export default async function Home(){const {products}=await getCatalogue();const reviews=await featuredReviews(products.filter(p=>p.active).map(p=>p.slug));return <ShopShell><PremiumHome products={products} reviews={reviews}/></ShopShell>;}
