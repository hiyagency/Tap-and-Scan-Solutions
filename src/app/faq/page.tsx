import type { Metadata } from "next";
import { ShopShell } from "@/components/shop/shell";
export const metadata:Metadata={title:"Frequently asked questions",description:"Questions about NFC.HIY cards, customisation, delivery and support."};
const questions=[
 "How does an NFC card work?",
 "Which phones support NFC and QR scanning?",
 "Can I add my own logo and branding?",
 "How do I approve my design before production?",
 "Can I change the destination link after receiving my card?",
 "How does the buy-two-get-one-free card offer work?",
 "When will the 15% NFC stand offer become available?",
 "How are shipping charges and tax calculated?",
 "How long will my order take to arrive?",
 "How can I track my order?",
 "What should I do if my card is damaged or stops working?",
 "What are the return and refund terms for customised products?",
 "How do I contact the support team?",
];
export default function FAQ(){return <ShopShell><main id="shop-main" className="shop-page"><p className="shop-eyebrow">BEFORE YOU TAP</p><h1 className="shop-page-title">Good questions.</h1><p>Our detailed answers are being prepared. For help now, email <a href="mailto:hello@hiy.agency">hello@hiy.agency</a>.</p><ol className="faq-questions">{questions.map(q=><li key={q}>{q}</li>)}</ol></main></ShopShell>;}
