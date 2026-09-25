import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Fingerprint, RefreshCw, MessageCircle } from "lucide-react";
import { HeroMotion } from "@/components/shop/hero-motion";
import { ShopShell } from "@/components/shop/shell";
import { CatalogueGrid } from "@/components/shop/catalogue-grid";
import { Showcase } from "@/components/shop/showcase";
import { getCatalogue } from "@/lib/shop/catalogue-server";
export const revalidate=60;
export const metadata:Metadata={title:"Shop NFC Cards & Smart QR Products in India",description:"Find your connection. Shop custom NFC and QR cards for Google reviews, Instagram, WhatsApp, LinkedIn and more.",alternates:{canonical:"/"}};
export default async function Home(){
 const {products}=await getCatalogue();
 return <ShopShell><main id="shop-main"><section className="shop-intro shop-intro-alive"><div><p className="shop-eyebrow"><span className="live-dot"/> YOUR NEXT CONNECTION STARTS HERE</p><h1>One tap.<br/><span>More possibilities.</span></h1><div className="shop-intro-note"><p>Turn a simple hello into a follow, a review, a conversation. Your brand. One smart card.</p><a href="#collection">Find your card <ArrowDownRight size={21}/></a></div></div><HeroMotion/></section><div className="connection-strip" aria-label="Tap. Scan. Connect."><span>TAP TO CONNECT</span><i>↗</i><span>SCAN TO DISCOVER</span><i>↗</i><span>MADE FOR YOUR BRAND</span><i>↗</i></div>
 <CatalogueGrid products={products.filter(p=>p.active)}/>
 <section className="shop-feature"><div><p className="shop-eyebrow">SMALL FORMAT. BIG POTENTIAL.</p><h2>Physical card.<br/>Digital possibilities.</h2><p>A connection that keeps up with your business. Tap with NFC or scan the QR to open the destination you choose.</p><Link href="/products/multi-link" className="shop-button">Meet the all-in-one <ArrowUpRight size={18}/></Link></div><Showcase/></section>
 <section className="shop-promises"><article><Fingerprint/><h3>Your brand, your way.</h3><p>Add your logo. Our team will reach out on WhatsApp to confirm your design before production.</p></article><article><RefreshCw/><h3>New link. Same card.</h3><p>Changed your Instagram username? Ask our team to update your smart QR destination. Your printed QR stays the same.</p></article><article><MessageCircle/><h3>People behind the product.</h3><p>From choosing a design to your next update, speak directly with the team making your cards.</p></article></section>
 <section className="shop-last"><p className="shop-eyebrow">THREE STEPS. THAT’S IT.</p><h2>Pick it. Make it yours. Connect.</h2><div><span>01 / Find your card</span><span>02 / Add your logo</span><span>03 / Checkout</span></div><Link href="/about">Get to know the people behind the tap <ArrowUpRight size={18}/></Link></section>
 </main></ShopShell>;
}
