import type { Metadata } from "next";
import { ShopShell } from "@/components/shop/shell";
import { FAQAccordion } from "@/components/shop/faq-accordion";
export const metadata:Metadata={title:"Frequently asked questions",description:"Answers about NFC.HIY cards, customisation, shipping and order tracking."};
export default function FAQ(){return <ShopShell><main id="shop-main" className="shop-page premium-help"><p className="shop-eyebrow">BEFORE YOU TAP</p><h1 className="shop-page-title">Good questions.<br/>Straight answers.</h1><p>Choose your next connection with confidence.</p><FAQAccordion/><aside><h2>Need a hand?</h2><p>Tell us what you want your next tap to do.</p><a className="shop-button" href="https://wa.me/919109167827">Talk to our team</a></aside></main></ShopShell>;}
