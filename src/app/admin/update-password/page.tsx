import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { updatePasswordAction } from "@/app/admin/actions";
import { FlashMessage } from "@/components/admin/ui";

type UpdatePasswordProps = { searchParams: Promise<{ error?: string }> };

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordProps) {
  const params = await searchParams;
  return (
    <main className="admin-login-page">
      <Link className="admin-login-back" href="/admin/login"><ArrowLeft size={17} /> Back to owner login</Link>
      <section className="admin-login-card">
        <Image src="/brand/tap-and-scan-logo.png" alt="Tap and Scan Solutions" width={86} height={86} priority />
        <p className="eyebrow">Secure account recovery</p>
        <h1>Choose a new password.</h1>
        <p>Use at least 10 characters. This link works only after Supabase has verified the recovery email.</p>
        <FlashMessage error={params.error} />
        <form action={updatePasswordAction} className="admin-form login-form">
          <label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
          <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={10} required /></label>
          <button className="button button-dark" type="submit"><KeyRound size={17} /> Update password</button>
        </form>
      </section>
    </main>
  );
}

