import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy", description: "How NFC.HIY handles enquiry information." };

export default function PrivacyPage() {
  return (
    <main className="legal-page section-shell">
      <Link className="brand" href="/"><Image src="/brand/nfc-hiy.webp" alt="" width={64} height={64} /><span><strong>NFC.HIY</strong><small>POWERED BY HIY AGENCY</small></span></Link>
      <article>
        <p className="eyebrow"><span /> Privacy</p>
        <h1>Your information, handled with care.</h1>
        <h2>Shopping and customer accounts</h2><p>Google sign-in provides your name, email and account identifier. We use your contact details, shipping address, order details and optional PNG logo to process your order, arrange delivery and contact you on WhatsApp about design approval. PayU processes payments; we do not store your card details. NimbusPost receives the delivery information needed to quote and fulfil shipments.</p>
        <h2>Logo files and your shopping bag</h2><p>Your bag and selected logo drafts are saved in your browser until checkout. Submitted logos are stored privately and are accessible to the owner and the customer who supplied them. Temporary download links expire. Contact us to request removal of files that are no longer needed for an order.</p>
        <p>When you submit an enquiry, NFC.HIY stores the contact and project information you provide so we can respond, prepare a quotation and maintain an enquiry history.</p>
        <h2>What we collect</h2><p>Name, business name, phone or WhatsApp number, optional email and city, product interests, timeline, quantity and any message you provide.</p>
        <h2>How it is used</h2><p>The information is used only to respond to the enquiry, plan or deliver requested services, and maintain customer and payment records. It is not sold to third parties.</p>
        <h2>Storage and access</h2><p>Records are stored in the secured business database. The owner manages business records; signed-in customers can access only their own orders and submitted logos. Basic one-way technical fingerprints may be retained to reduce repeated spam submissions.</p>
        <h2>Retention</h2><p>Enquiry-only records are reviewed after 12 months and deleted or anonymised when they are no longer needed. If an enquiry becomes a customer relationship, relevant service and payment records are retained for delivery, accounting and applicable legal obligations.</p>
        <h2>Updates or removal</h2><p>To request correction or removal of an enquiry record, email <a href="mailto:hello@hiy.agency">hello@hiy.agency</a> or call <a href="tel:+919109167827">+91 9109167827</a>.</p>
        <p className="legal-updated">Last updated: 25 September 2026</p>
      </article>
    </main>
  );
}
