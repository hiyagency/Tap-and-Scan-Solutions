import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Nfc, QrCode, MessageCircle, Fingerprint, ArrowRight } from "lucide-react";
import { ProductStory, WhyHiy } from "./product-story";
import { FeaturedReviews } from "./featured-reviews";
import type { FeaturedReview } from "@/lib/shop/reviews";
import { FAQAccordion } from "./faq-accordion";
import { CatalogueGrid } from "./catalogue-grid";
import type { Product } from "@/lib/shop/catalogue";
import styles from "./premium-home.module.css";
import { HeroShowcase } from "./hero-showcase";
export function PremiumHome({products,reviews=[]}:{products:Product[];reviews?:FeaturedReview[]}){
 const active=products.filter(p=>p.active);const hero=active.find(p=>p.slug==="smart-nfc-standee")||active.find(p=>p.slug==="multi-link")||active[0];
 return <main id="shop-main" className={styles.home}>
 <section className={styles.hero}><div><p className={styles.eyebrow}><Nfc size={18}/> SMART NFC PRODUCTS</p><h1>One tap.<br/><span>Instant connection.</span></h1><p className={styles.intro}>Custom NFC stands and cards that open your profile, review page or business links with a tap.</p><div className={styles.actions}><a className={styles.primary} href="#collection">Shop NFC products <ArrowUpRight size={19}/></a><a href="#how-it-works">See how it works <ArrowRight size={18}/></a></div><p className={styles.micro}>A physical product. A direct digital connection.</p></div>
 <HeroShowcase products={active}/></section>
 <section className={styles.benefits} aria-label="Product benefits">{[[Nfc,"Tap to connect","Open your configured destination."],[QrCode,"Smart QR by U2L.AI","Custom QR destination; ask us to update the link."],[Fingerprint,"Make it yours","Branding on supported designs."],[MessageCircle,"Real people, direct support","Design confirmation on WhatsApp."]].map(([Icon,title,copy])=>{const Symbol=Icon as typeof Nfc;return <div key={String(title)}><Symbol size={23}/><span><strong>{String(title)}</strong><small>{String(copy)}</small></span></div>;})}</section>
 <CatalogueGrid products={active}/>
 <section className={styles.explain} id="how-it-works"><div><p className={styles.eyebrow}>LESS SEARCHING. MORE CONNECTING.</p><h2>The shortest distance<br/>between hello and <span>connected.</span></h2><p>Give people a direct route to your profile or business link, without asking them to search for it.</p><ol><li>Tap or scan</li><li>Open the link</li><li>Take the next step</li></ol><p className={styles.micro}>NFC requires a compatible, NFC-enabled phone. QR cards can also be scanned using the phone’s camera. Online destinations need an internet connection.</p></div><div className={styles.phone}><Nfc size={42}/><h3>From your card<br/>to their screen.</h3><div><QrCode/><span>Your chosen destination<small>Profile · Review page · Business links</small></span></div><small>Tap / scan interaction illustrated</small></div></section>
 <section className={styles.steps}><div><p className={styles.eyebrow}>MADE AROUND YOU</p><h2>Choose it.<br/>Make it personal.</h2><Link href="/about">Meet the people behind your card <ArrowUpRight size={18}/></Link></div><ol>{[["Find your connection","Choose the platform and design that fit how you do business."],["Make it your own","Upload a logo where supported. Our team confirms your design and destination with you on WhatsApp."],["Put it to work","Share your configured destination with a tap, or use the QR on your card."]].map(([title,copy],i)=><li key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></section>
 <section className={styles.cases}><p className={styles.eyebrow}>WHAT WILL YOUR NEXT TAP DO?</p><h2>A connection with a purpose.</h2><div>{[["google-reviews","Make feedback easier","A direct route to your Google review page."],["instagram","Keep the connection going","Bring your Instagram profile into real-world introductions."],["whatsapp","Open a conversation","Let customers reach your business on WhatsApp."]].map(([slug,title,copy])=>{const p=active.find(p=>p.slug===slug);return p?<Link href={"/products/"+slug} key={slug}><Image src={p.variants[0].image} alt={p.name} width={500} height={500} sizes="(max-width:700px) 85vw, 28vw"/><h3>{title}<ArrowUpRight size={20}/></h3><p>{copy}</p></Link>:null;})}</div></section>
 <ProductStory products={active}/>
 <FeaturedReviews reviews={reviews} products={active}/>
 <WhyHiy/>
 <section className={styles.faq}><div><p className={styles.eyebrow}>BEFORE YOUR FIRST TAP</p><h2>A few things<br/>worth knowing.</h2><Link href="/faq">All frequently asked questions <ArrowUpRight size={18}/></Link></div><FAQAccordion questions={[0,3,4,6]}/></section>
 <section className={styles.final}><div><Nfc size={38}/><h2>Make every tap count.</h2><p>Find the connection that fits your business.</p><a className={styles.primary} href="#collection">Explore NFC products <ArrowUpRight size={19}/></a></div>{hero&&<Image src={hero.variants[0].image} width={360} height={360} sizes="(max-width:700px) 220px, 30vw" alt={hero.name}/>}</section>
 </main>;
}
