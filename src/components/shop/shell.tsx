import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ShopAnnouncement } from "./announcement";
import { getCatalogue } from "@/lib/shop/catalogue-server";
import { PremiumHeader } from "./premium-header";
export async function ShopShell({children}:{children:React.ReactNode}){const {products}=await getCatalogue();return <div className="shop">
 <a className="shop-skip" href="#shop-main">Skip to content</a>
 <ShopAnnouncement/>
 <PremiumHeader products={products}/>
 {children}
 <footer className="shop-footer"><div><Image src="/brand/nfc-hiy.webp" width={52} height={52} alt="NFC.HIY"/><h2>A small card.<br/>A bigger connection.</h2><a className="shop-agency-credit" href="https://hiy.agency" target="_blank" rel="noopener noreferrer">Powered by HIY Agency <ArrowUpRight size={15} aria-hidden="true"/></a></div><div><Link href="/#collection">Shop products</Link><Link href="/faq">Help & FAQs</Link><Link href="/about">Our story</Link><Link href="/account/orders">Track your order</Link><Link href="/privacy">Privacy</Link>{process.env.COMMERCE_POLICIES_APPROVED==="true"&&process.env.SHIPPING_POLICY&&process.env.REFUND_POLICY&&<Link href="/policies">Shipping & returns</Link>}<a href="https://instagram.com/nfc.hiy" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13}/></a><a href="mailto:hello@hiy.agency">hello@hiy.agency</a><a href="https://wa.me/919109167827">+91 9109167827</a></div><p className="shop-copyright">© {new Date().getFullYear()} NFC.HIY. Platform names belong to their respective owners.</p></footer>
 </div>;}
