# NFC.HIY ecommerce preview

## Included

Seven products / eight designs, product films and stills, desktop motion and a Remotion showcase, mobile-first catalogue, per-item PNG drafts, persistent bag, Buy Now checkout dialog, Google-only customer account flow, separate owner login, order pages, catalogue and order administration, private logo storage, PayU and iThink server adapters. Previous storytelling content and public shipments are at `/about`.

Supabase migration `20260925112608_ecommerce.sql` is additive. Existing CRM data is preserved. Seed only missing products with `node --env-file=.env.local scripts/seed-commerce.mjs`. Never reset the live database. Prices are nullable paise values and `xxx` cannot be charged.

## Launch gate — currently OFF

Configure Vercel **Preview** first. Never put provider secrets in `NEXT_PUBLIC_` variables.

- Existing Supabase URL, publishable key, service-role key and lead fingerprint secret.
- `NEXT_PUBLIC_SITE_URL`: intended deployment origin.
- `PAYU_KEY`, `PAYU_SALT`, `PAYU_ENV=production`.
- `ITHINK_ACCESS_TOKEN`, `ITHINK_SECRET_KEY`, `ITHINK_ENV=production`.
- `ITHINK_PICKUP_ID`, `ITHINK_RETURN_ID`, `ITHINK_PICKUP_PINCODE`, `ITHINK_COURIER`, optional `ITHINK_SERVICE`.
- Actual packed `PARCEL_LENGTH_CM`, `PARCEL_WIDTH_CM`, `PARCEL_UNIT_HEIGHT_CM`, `PARCEL_UNIT_WEIGHT_KG`. Current packing calculation stacks equal-size cards; verify parcel accuracy for every permitted quantity before launch.
- Approved `SHIPPING_POLICY`, `REFUND_POLICY`, and `COMMERCE_POLICIES_APPROVED=true`.
- `COMMERCE_PROVIDERS_VERIFIED=true` only after real-provider test evidence.
- Positive final prices in Catalogue. Finally `COMMERCE_LIVE=true`.

Until all checks pass, checkout is explicitly a preview and no order/payment is created. Missing quotes never become free shipping. Test credentials and real financial records must not be mixed; use a separate test project/environment for provider testing.

## Google setup

Google provider is currently disabled in Supabase. Add the Google OAuth client ID and secret and enable Google in Supabase Auth. Set the Google authorized callback to `https://kywyyfgpggvgjblnsmxk.supabase.co/auth/v1/callback`. Allow the exact approved deployment's `/auth/customer-callback` in Supabase redirects; localhost and the existing production host were prepared. Add the preview host after deployment. Owner `/auth/callback` stays unchanged. Customer sessions never create an owner profile.

Buy Now remains in a native accessible dialog. Google may open a separate authentication window and return to the dialog. If the browser blocks that window, the saved configuration survives a same-tab sign-in fallback.

## Provider verification before accepting orders

Configure PayU callback `/api/shop/payu/callback` and webhook `/api/shop/payu/webhook`. Both validate signatures and reconcile with PayU before recording payment. Verify success, failure, cancellation, pending verification, duplicate callbacks and incorrect amounts with the actual merchant account. Customer refresh also reconciles pending payments.

Check iThink rates/serviceability against the account's enabled courier/service, actual parcel and pickup. Verify rate changes, unsupported PINs, booking, label URL, tracking status spelling and delivery response format. A booking timeout is deliberately locked for manual reconciliation in iThink, not blindly retried; support reconciliation is required before retrying an ambiguous booking. Shipping is booked only by the owner after design approval and production.

The order ledger records verified payment including shipping exactly once. Refund/shipping expense actions record **already completed** provider transactions; they do not issue refunds. Use unique provider references. Public shipment-gallery publication remains separate and manual.

## Checks performed

- Type checking, lint, production build, 14 unit tests.
- Browser checks at 360, 390, 430, 768, 1024, 1440 and 1920px.
- Product variants, PNG browser draft, bag persistence, Buy Now dialog, six related products, disabled checkout, owner/customer redirects, reduced motion, pause control, Google logo/configuration message, focus restoration.
- `scripts/verify-commerce.sql`: database transaction rolled back after testing duplicate order/payment protection, amount mismatch rejection, refunds/net cash flow, purchaser isolation, public catalogue and CRM isolation. Test data does not persist.

Still required: Google OAuth end-to-end with real credentials, real PayU/iThink sandbox and production smoke tests, authorized owner UI walkthrough, final product details/prices/taxes/policies and preview approval. This is not an assertion of payment-provider certification or a public launch.
