import Link from "next/link";
import { PackageCheck, MessageCircle, ArrowLeft } from "lucide-react";
import { ShopShell } from "@/components/shop/shell";
import { GoogleButton } from "@/components/shop/google-button";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const q = await searchParams;
  return <ShopShell><main id="shop-main" className="shop-page account-entry">
    <section className="account-intro">
      <p className="shop-eyebrow">YOUR NFC.HIY ACCOUNT</p>
      <h1>Your order.<br/>Every next step.</h1>
      <p>Follow your NFC products from design confirmation to delivery.</p>
      <ul>
        <li><PackageCheck aria-hidden="true"/><span><strong>Keep track</strong>Find your orders and available delivery updates in one place.</span></li>
        <li><MessageCircle aria-hidden="true"/><span><strong>Make it yours</strong>Our team confirms your design with you on WhatsApp before production.</span></li>
      </ul>
    </section>
    <section className="account-signin" aria-labelledby="signin-title">
      <p className="shop-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
      <h2 id="signin-title">Sign in to continue</h2>
      <p>Use the Google account you used at checkout to see your orders.</p>
      {q.error && <p role="alert" className="shop-error">{q.error}</p>}
      <GoogleButton next={q.next === "/checkout" ? "/checkout" : "/account/orders"}/>
      <p className="account-fineprint">No new password to remember. Read how we handle your details in our <Link href="/privacy">privacy information</Link>.</p>
      <Link className="account-back" href="/#collection"><ArrowLeft size={17} aria-hidden="true"/> Continue shopping</Link>
    </section>
  </main></ShopShell>;
}
