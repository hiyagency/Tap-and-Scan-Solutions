# NFCS Orders — admin-only upgrade

## Architecture preserved

Next.js 16 App Router, Supabase SSR/Auth/Postgres, PayU server-side verification and iThink booking remain in place. No framework/dependency upgrades, checkout rewrite, product URL changes, public metadata changes or payment-provider changes were made. COD remains unsupported because adding it would change the checkout. No order/customer model was duplicated.

The owner still uses `profiles.role = 'owner'` and `hello@hiy.agency`. Route protection now checks both the signed session and that existing profile. Customer Google accounts do not receive owner access.

## Screens

- `/admin`: daily order KPIs (India Standard Time), recent orders, unread count and live connection status.
- `/admin/orders`: newest-first, 25 per page, search by reference/name/phone/email, payment and fulfilment filters.
- `/admin/orders/[id]`: items, customer/address, PayU identifiers, totals, timeline, private notes and guarded actions.
- `/admin/customers`: existing CRM plus online order count, net paid spend and latest order date.
- `/admin/settings`: installation/notification guidance, links to every existing tool, sign out.
- `/admin/business`: the previous business dashboard, including lifetime income/cash flow, preserved here.

Existing design workflow labels are retained: New/design approval → Confirmed → Processing → Packed → existing iThink booking → Shipped → Delivered. Cancellation is stored separately from payment and fulfilment stage to avoid changing PayU behavior. It is blocked after a booking or dispatch and never issues a refund.

## Database migration

`supabase/migrations/20260925170123_admin_orders_pwa.sql` was applied to the existing project `kywyyfgpggvgjblnsmxk`.

- `shop_orders`: additive `updated_at`, `received_at`, `cancelled_at`, `cancellation_reason`.
- `shop_order_events`: additive `event_type`, `metadata`, `created_by`.
- `shop_admin_order_state`: private notes/read timestamp; one auxiliary record per existing order, not another order system.
- `push_subscriptions`: private native Web Push subscription storage, prepared for a future sender.
- Owner-only RPCs for order actions, KPIs and CRM order totals. Indexed date/payment lookups.
- Triggers stamp updates, audit shipping/delivery/cancellation/failure/refunds, and serialise cancellation against shipment booking.

No existing rows were deleted or reset. Migration dry-run and security/action tests used explicit transactions and rolled back all test records.

## RLS and live sync

Existing purchaser policies remain. Owner SELECT policies were added to orders, items, events, account links, payment references and fulfilments using the existing `private.is_owner()` function. Owner UPDATE is limited to fulfilment/cancellation columns; browser clients cannot mark a payment paid. Private notes/read-state are owner-only. Push subscriptions require both owner role and `user_id = auth.uid()` for reading/writing/deleting.

Only `shop_orders` and `shop_admin_order_state` are enabled in `supabase_realtime`. The admin mounts one channel, debounces refreshes, cleans up on exit, reconciles on reconnect/foreground, and uses a visible-tab 60-second fallback. It does not load the full order history into the browser. Verified paid orders trigger in-app notices; unread state is shared across sessions/devices. Supported browsers receive app-badge updates.

These publication settings were applied by the migration. No further dashboard toggle is needed for them. Existing Supabase free-tier quotas still apply; this introduces no paid providers or paid plan upgrades.

## iPhone installation

1. Open the approved HTTPS deployment followed by `/admin` in Safari. For a Vercel-protected preview, first sign into Vercel.
2. Sign in with the existing owner account.
3. Tap Share → Add to Home Screen → Add.
4. Launch **Orders** from the Home Screen. Sign in again if iOS uses a separate session.

The manifest is admin-only, named **NFCS Orders**, short name **Orders**, standalone portrait, start URL `/admin`. Apple touch icon and maskable/standard icons are supplied. Bottom navigation respects iPhone safe areas. The service worker handles no fetch caching: private orders, sessions and customer data are never saved for offline browsing.

## Notifications: current versus prepared

**Automatic now:** in-app notices and shared unread badges while signed in with the app open.

**Optional foreground device notices:** on iOS 16.4+, open the installed Home Screen app → Settings → Enable Order Notifications → Allow. Permission is requested only after this tap. Notices are deduplicated by order ID in the browser. Unsupported APIs fall back safely to in-app notices.

**Not active:** closed-app/background Web Push. Its worker receiver and owner-scoped subscription storage adapter are prepared, but no sender is deployed and no background delivery is promised. The optional `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` entries in `.env.example` are reserved for activating a standards-based sender later. No new environment variables are required for the current admin/live sync/PWA features. Never put the private key in `NEXT_PUBLIC_` variables.

## Files changed

- Admin routes/layout/loading: `src/app/admin/{layout.tsx,orders.css,manifest.webmanifest/route.ts,order-actions.ts,push-actions.ts}` and `(secure)/{page.tsx,business/page.tsx,orders/page.tsx,orders/[id]/page.tsx,settings/page.tsx,customers/page.tsx,layout.tsx,loading.tsx}`.
- Admin components: `admin-shell`, `order-controls`, `order-list`, `order-management`, `order-realtime`, `mobile-nav`, `notification-settings`.
- Data/auth/types: `src/lib/{admin-auth.ts,admin-orders.ts,order-types.ts,order-types.test.ts}`.
- Small booking safety adjustment: `src/app/admin/commerce-actions.ts` (no payment behavior change).
- Worker/icons: `public/admin/`; icon build helper `scripts/prepare-admin-icons.mjs`.
- Migration and rollback tests: `supabase/migrations/20260925170123_admin_orders_pwa.sql`, `scripts/verify-admin-orders.sql`.
- Worker-specific headers: `next.config.ts`; optional env template and gitignore exception.

## Verification and remaining acceptance checks

Lint, type checking, production build and 17 unit tests passed. Storefront responsive/cart/variant/Buy Now regression tests passed at 360–1920px. Manifest, icon URLs, worker/no-cache architecture, admin redirects and admin-only metadata were checked in the browser. Database tests covered owner/customer isolation, private notes, shared unread detection, state transitions, stale edits, cancellation, booked-order rejection, timeline creation and duplicate verified payment protection.

No real orders existed during this check. Paid-order INSERT/UPDATE delivery over an authenticated live Realtime session, populated owner UI pagination/search and physical-iPhone Home Screen/notification behavior still require a signed-in acceptance run. Payment-provider end-to-end checks remain blocked by the pre-existing missing credentials; this upgrade does not change those gates. COD is not applicable.

Supabase's existing leaked-password-protection advisory may require a supported plan/setting; no plan upgrade or password changes were made.
