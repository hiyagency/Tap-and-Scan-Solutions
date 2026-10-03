import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, MessageCircle, PencilRuler, RefreshCw } from "lucide-react";
import { priceLabel, type Product } from "@/lib/shop/catalogue";
import styles from "./product-story.module.css";

export function ProductStory({ products }: { products: Product[] }) {
  const product = products.find(product => product.slug === "multi-link" && product.active);
  if (!product) return null;
  const variant = product.variants.find(variant => variant.name === "Custom Logo") ?? product.variants[0];
  return <>
    <section className={styles.spotlight} aria-labelledby="spotlight-title">
      <Link className={styles.image} href={"/products/" + product.slug} aria-label={"Explore " + product.name}>
        <Image src={variant.image} alt={product.name + ", " + variant.name + " design"} width={500} height={500} sizes="(max-width:700px) 88vw, 40vw"/>
      </Link>
      <div className={styles.copy}>
        <p className="shop-eyebrow">ONE CARD. MORE POSSIBILITIES.</p>
        <h2 id="spotlight-title">Your brand.<br/>All in one place.</h2>
        <p>Not every introduction belongs on one platform. Bring your business links together in a single destination, then share it with a tap or scan.</p>
        <ul><li><Check size={18}/>Classic and custom-logo designs</li><li><Check size={18}/>NFC tap with a QR alternative</li><li><Check size={18}/>Design approval with our team</li></ul>
        <div className={styles.purchase}><strong>{priceLabel(variant.price_paise)}</strong>{variant.price_paise!==null&&<small>+18% tax · Shipping at checkout</small>}</div>
        <Link className="shop-button" href={"/products/"+product.slug}>Choose your card <ArrowUpRight size={18}/></Link>
      </div>
    </section>
    <section className={styles.comparison} aria-labelledby="comparison-title">
      <div><p className="shop-eyebrow">BEYOND THE PRINTED INTRODUCTION</p><h2 id="comparison-title">Give them a next step.<br/>Not just your details.</h2><p>A printed-only card shares information. An NFC + QR card also gives people a direct way to open your digital destination.</p></div>
      <div className={styles.table}>
        <table><caption className="sr-only">Printed-only card compared with an NFC.HIY smart QR card</caption><thead><tr><th scope="col">Interaction</th><th scope="col">Printed-only card</th><th scope="col">NFC.HIY card</th></tr></thead><tbody>
          <tr><th scope="row">Share a link</th><td>Read and type the address</td><td>Tap or scan to open</td></tr>
          <tr><th scope="row">Change your destination</th><td>Printed text stays the same</td><td>Request a smart QR link update</td></tr>
          <tr><th scope="row">Ways to connect</th><td>Read the printed details</td><td>NFC chip + camera-scannable QR</td></tr>
        </tbody></table>
        <p>Comparison is with a card containing printed details only. NFC needs a compatible phone; online links need an internet connection.</p>
      </div>
    </section>
  </>;
}

export function WhyHiy() {
  return <section className={styles.why} aria-labelledby="why-hiy-title">
    <div><p className="shop-eyebrow"><a className={styles.agencyCredit} href="https://hiy.agency" target="_blank" rel="noopener noreferrer">POWERED BY HIY AGENCY <ArrowUpRight size={14} aria-hidden="true"/></a></p><h2 id="why-hiy-title">A real team.<br/>Behind every tap.</h2><Link href="/about">Get to know us <ArrowUpRight size={18}/></Link></div>
    <div className={styles.supportList}>
      <article><PencilRuler size={23}/><div><h3>Your design, confirmed</h3><p>Share your logo on supported designs. We confirm the artwork and destination with you before production.</p></div></article>
      <article><MessageCircle size={23}/><div><h3>A direct conversation</h3><p>Speak to the team on WhatsApp for setup questions, design approval and order assistance.</p></div></article>
      <article><RefreshCw size={23}/><div><h3>Keep your connection current</h3><p>Changed your Instagram username? Ask us to update your smart QR destination. Keep the printed card you already have.</p></div></article>
    </div>
  </section>;
}
