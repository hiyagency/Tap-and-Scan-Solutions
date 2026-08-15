# TAP AND SCAN SOLUTIONS

A mobile-first Next.js storytelling website and owner-only operations console for QR, NFC and custom acrylic products.

## Included

- Editorial public website built entirely from supplied product footage and the official logo.
- U2L.AI positioned as the default QR generation and active-tracking layer, using the supplied official mark.
- Separate monthly scan-analytics offering, recordable through the existing recurring customer-service model.
- Two-step lead form with shared client/server validation, honeypot protection, HMAC submission fingerprinting and database-backed rate limiting.
- Owner dashboard for leads, conversion, customers, services, income, expenses, dues and monthly renewals.
- Atomic due-payment function: creates one linked income transaction and updates the due balance in the same database operation.
- Supabase SSR authentication, secure cookies and RLS on every business table.
- Static preview mode when Supabase is not configured. Preview records are labelled and mutations remain disabled.
- Responsive layouts at 360–1920px, stacked admin cards on narrow screens, keyboard focus treatment and reduced-motion video fallbacks.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and provide the environment values.
3. Run `pnpm dev` and open `http://localhost:3000`.

Useful checks:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Supabase setup

The dedicated remote project is `tap-and-scan-solutions` in Mumbai (`kywyyfgpggvgjblnsmxk`). Its migrations, owner profile, signup restrictions and recovery redirects are already configured. For another environment:

1. Create a dedicated Supabase project.
2. Apply `supabase/migrations/20260815202014_initial_crm.sql` using the CLI or SQL editor.
3. Disable public signups in Supabase Auth.
4. Invite `hello@hiy.agency` as the sole email/password user.
5. Run `supabase/seed.sql` after the auth user exists. This creates the approved `owner` profile.
6. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and a long random `LEAD_FINGERPRINT_SECRET`.

The service-role key is imported only by the server-side lead API. The browser uses the publishable key and all business tables reject anonymous access.

## Vercel preview

Create a new Vercel project from this directory, add the four Supabase secrets to the Preview environment, and set `NEXT_PUBLIC_SITE_URL` to the assigned preview URL. Promote to production only after the preview and live owner account have been verified.

## Media provenance

The media under `public/media` was extracted and optimized from the five supplied clips. Product artwork, QR codes, branding and physical form were not regenerated. Experimental AI cleanup outputs were rejected because they changed printed product details; only faithful source frames are shipped.
