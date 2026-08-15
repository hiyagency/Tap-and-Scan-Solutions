import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy", description: "How TAP AND SCAN SOLUTIONS handles enquiry information." };

export default function PrivacyPage() {
  return (
    <main className="legal-page section-shell">
      <Link className="brand" href="/"><Image src="/brand/tap-and-scan-logo.png" alt="" width={64} height={64} /><span><strong>TAP AND SCAN</strong><small>SOLUTIONS</small></span></Link>
      <article>
        <p className="eyebrow"><span /> Privacy</p>
        <h1>Your enquiry stays business-focused.</h1>
        <p>When you submit an enquiry, TAP AND SCAN SOLUTIONS stores the contact and project information you provide so we can respond, prepare a quotation and maintain an enquiry history.</p>
        <h2>What we collect</h2><p>Name, business name, phone or WhatsApp number, optional email and city, product interests, timeline, quantity and any message you provide.</p>
        <h2>How it is used</h2><p>The information is used only to respond to the enquiry, plan or deliver requested services, and maintain customer and payment records. It is not sold to third parties.</p>
        <h2>Storage and access</h2><p>Records are stored in the secured business database. Access is restricted to the owner account. Basic one-way technical fingerprints may be retained to reduce repeated spam submissions.</p>
        <h2>Retention</h2><p>Enquiry-only records are reviewed after 12 months and deleted or anonymised when they are no longer needed. If an enquiry becomes a customer relationship, relevant service and payment records are retained for delivery, accounting and applicable legal obligations.</p>
        <h2>Updates or removal</h2><p>To request correction or removal of an enquiry record, email <a href="mailto:hello@hiy.agency">hello@hiy.agency</a> or call <a href="tel:+916261565667">+91 62615 65667</a>.</p>
        <p className="legal-updated">Last updated: 16 August 2026</p>
      </article>
    </main>
  );
}
