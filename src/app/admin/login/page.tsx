import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { loginAction, resetPasswordAction } from "@/app/admin/actions";
import { FlashMessage } from "@/components/admin/ui";
import { hasPublicSupabaseConfig } from "@/lib/supabase/config";

type LoginPageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = hasPublicSupabaseConfig();

  return (
    <main className="admin-login-page">
      <Link className="admin-login-back" href="/"><ArrowLeft size={17} /> Public website</Link>
      <section className="admin-login-card">
        <Image src="/brand/tap-and-scan-logo.png" alt="Tap and Scan Solutions" width={86} height={86} priority />
        <p className="eyebrow">Owner-only workspace</p>
        <h1>Business, in one place.</h1>
        <p>Track enquiries, customers, payments and dues with the account approved in Supabase.</p>
        <FlashMessage message={params.message} error={params.error} />

        {configured ? (
          <>
            <form action={loginAction} className="admin-form login-form">
              <label>Email<input name="email" type="email" defaultValue="hello@hiy.agency" autoComplete="email" required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
              <button className="button button-dark" type="submit"><LockKeyhole size={17} /> Sign in securely</button>
            </form>
            <details className="reset-panel">
              <summary>Reset password</summary>
              <form action={resetPasswordAction} className="admin-form">
                <label>Owner email<input name="email" type="email" defaultValue="hello@hiy.agency" required /></label>
                <button className="text-button" type="submit">Send reset link</button>
              </form>
            </details>
          </>
        ) : <div className="login-preview" role="alert"><p>The admin database is not configured for this deployment. Add the required Supabase environment variables in Vercel, then redeploy.</p></div>}
      </section>
    </main>
  );
}
