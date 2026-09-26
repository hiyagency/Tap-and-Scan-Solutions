# Card prices, tax and NimbusPost

- Seven card products / eight variants: INR 299 before tax. Keychains unchanged.
- Mandatory 18% tax on the product subtotal, rounded once to the nearest paise. Shipping is added separately at the provider's quoted total, not taxed again by this implementation.
- Example: INR 299 + INR 53.82 tax + quoted shipping.
- Confirm the business's tax treatment with its accountant before accepting payments.
- NimbusPost API v2: https://api-v2.nimbuspost.com/docs/reference/v2
- Rates use `x-api-key` and `x-api-secret`, gram weights and integer-paise totals. Booking uses kilograms.
- Shipping estimates are independent of PayU activation. Signed-in customers can request rates while payments remain disabled.
- Credentials are server-only. Rates are checked again before payment; invalid or absent rates block checkout.
- New orders store NimbusPost as their provider. Historical iThink shipments retain their original tracking integration.
- Booking remains an explicit admin action with the existing unique booking lock; ambiguous failures require reconciliation, not automatic retry. Labels are stored from the booking response.

## Activation required

1. Apply the additive 20260926185826_card_pricing_tax_nimbuspost.sql migration. It preserves past orders and updates only card catalogue prices. Database access was denied by the connected tool in this session, so it was not applied.
2. Configure NIMBUSPOST_API_KEY, NIMBUSPOST_API_SECRET, NIMBUSPOST_PICKUP_PINCODE, NIMBUSPOST_WAREHOUSE_ID and actual packed parcel dimensions/weight in both local and Vercel server environments. Keychains are still unpriced; verify package settings per product before pricing those.
3. Validate live quotes, booking and tracking with the NimbusPost account. Rates use available[].result.totalPaise unchanged; missing or invalid rates never become free shipping.
4. Set NIMBUSPOST_VERIFIED=true only after verification. Existing PayU and commerce launch gates must also pass.
5. Deploy the code and verify catalogue prices, tax lines and a real provider checkout before opening payments.

No live shipment or charge was created during development.

## Verification on 27 September 2026

- API v2 authentication succeeded: warehouse endpoint returned HTTP 200, success true, with an empty warehouse list.
- Credentials saved only to ignored .env.local; never committed.
- Pickup PIN is configured locally as 484001. Pickup warehouse and packed measurements are not yet supplied, so live rates cannot be verified.
- Seven existing card catalogue rows (eight variants) were updated to INR299 in the configured Supabase project, using compare-and-set updates and a read-back verification. Keychains and historical orders were not changed.
- Configured Supabase project kywyyfgpggvgjblnsmxk is readable using the existing application service key, but lacks the new tax column. The signed-in dashboard exposes a different project. Do not switch databases or apply migrations to the unrelated project.
- PayU remains disabled. Do not declare the store ready to accept orders until the remaining configuration and provider checks pass.
- 28 tests, lint, type checking and the production build passed. Vercel CLI is not authenticated; its hosted environment settings were not changed.
