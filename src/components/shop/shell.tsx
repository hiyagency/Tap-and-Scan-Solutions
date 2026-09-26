import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShoppingBag, UserRound, Nfc } from "lucide-react";
import { ShopAnnouncement } from "./announcement";
export function ShopShell({children}:{children:React.ReactNode}){return <div className="shop">
 <a className="shop-skip" href="#shop-main">Skip to content</a>
 <ShopAnnouncement/>
 <header className="shop-header"><Link href="/" className="shop-brand"><Image src="/brand/nfc-hiy.webp" width={56} height={56} alt="NFC.HIY logo"/><span>NFC.HIY<span className="brand-by">powered by HIY AGENCY</span></span></Link>
 <nav aria-label="Shop navigation"><Link href="/#collection">Shop collection</Link><Link href="/about">Our story</Link><Link href="/account/orders" className="shop-account"><UserRound size={18}/><span>My orders</span></Link><Link href="/cart" aria-label="Shopping bag" className="bag-link"><ShoppingBag size={20}/><span>Bag</span></Link></nav></header>
 {children}
 <footer className="shop-footer"><div><Nfc size={30}/><h2>A small card.<br/>A bigger connection.</h2><p>NFC.HIY · Backed by HIY Agency</p></div><div><Link href="/about">Our story</Link><Link href="/account/orders">Track your order</Link><Link href="/privacy">Privacy</Link><a href="https://instagram.com/nfc.hiy" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13}/></a><a href="mailto:hello@hiy.agency">hello@hiy.agency</a><a href="https://wa.me/919109167827">+91 9109167827</a></div><p className="shop-copyright">© {new Date().getFullYear()} NFC.HIY. Platform names belong to their respective owners.</p></footer>
 </div>;}
