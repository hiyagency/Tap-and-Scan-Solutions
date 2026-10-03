import type { Metadata } from "next";
import { ShopShell } from "@/components/shop/shell";

export const metadata: Metadata = { title: "Privacy", description: "How NFC.HIY handles enquiry information." };

export default function PrivacyPage() {
  return (
    <ShopShell><main id="shop-main" className="shop-page storefront-legal">
      <article>
        <p className="shop-eyebrow">YOUR DATA & PRIVACY</p>
        <h1>Your information, handled with care.</h1>
        <p className="preview-note">This page provides an initial privacy summary. Our full policy will be published before live payments open.</p>
        <h2>Optional website analytics</h2><p>If you choose to allow analytics, Microsoft Clarity helps us understand browsing interactions, such as clicks and scrolling. Analytics stays off until you agree. Checkout, account and admin pages are excluded. You can change your choice using Analytics preferences in the shop.</p>
        <h2>Product reviews and photographs</h2><p>If you submit a review, your chosen display name, rating, review and approved photographs can appear publicly on the product page after moderation. Do not include addresses, phone numbers or other private information in reviews or photos. We use your account identifier to manage submissions and check whether a purchase is verified.</p>
        <h2>Shopping and customer accounts</h2><p>Google sign-in provides your name, email and account identifier. We use your contact details, shipping address, order details and optional PNG logo to process your order, arrange delivery and contact you on WhatsApp about design approval. Razorpay processes payments; we do not store your card details. Payment references and verified payment status are retained with your order. NimbusPost receives the delivery information needed to quote and fulfil shipments.</p>
        <h2>Logo files and your shopping bag</h2><p>Your bag and selected logo drafts are saved in your browser until checkout. Submitted logos are stored privately and are accessible to the owner and the customer who supplied them. Temporary download links expire. Contact us to request removal of files that are no longer needed for an order.</p>
        <p>When you submit an enquiry, NFC.HIY stores the contact and project information you provide so we can respond, prepare a quotation and maintain an enquiry history.</p>
        <h2>Saved carts and follow-up</h2><p>If you sign in and choose “Save cart for follow-up”, we save your name, email, WhatsApp number and selected products so our team can help you complete the purchase. This is optional and does not place an order. Use “Remove saved follow-up” in checkout or contact us to withdraw permission. Follow-up records expire after 30 days and are removed when the owner next opens the cart panel. Logo files and shipping addresses are not included in these records.</p>
        <h2>What we collect</h2><p>Name, business name, phone or WhatsApp number, optional email and city, product interests, timeline, quantity and any message you provide.</p>
        <h2>How it is used</h2><p>The information is used only to respond to the enquiry, plan or deliver requested services, and maintain customer and payment records. It is not sold to third parties.</p>
        <h2>Storage and access</h2><p>Records are stored in the secured business database. The owner manages business records; signed-in customers can access only their own orders and submitted logos. Basic one-way technical fingerprints may be retained to reduce repeated spam submissions.</p>
        <h2>Retention</h2><p>Enquiry-only records are reviewed after 12 months and deleted or anonymised when they are no longer needed. If an enquiry becomes a customer relationship, relevant service and payment records are retained for delivery, accounting and applicable legal obligations.</p>
        <h2>Updates or removal</h2><p>To request correction or removal of an enquiry record, email <a href="mailto:hello@hiy.agency">hello@hiy.agency</a> or call <a href="tel:+919109167827">+91 9109167827</a>.</p>
        <p className="legal-updated">Last updated: 27 September 2026</p>
      </article>
    </main></ShopShell>
  );
}
