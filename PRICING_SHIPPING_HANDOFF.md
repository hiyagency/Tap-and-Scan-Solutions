# Card prices, tax and NimbusPost

- Seven card products / eight variants: INR 299 before tax. Keychains unchanged.
- Mandatory 18% tax on the product subtotal, rounded once to the nearest paise. Shipping is added separately at the provider's quoted total, not taxed again by this implementation.
- Example: INR 299 + INR 53.82 tax + quoted shipping.
- Confirm the business's tax treatment with its accountant before accepting payments.
- NimbusPost Partners API v1: https://documenter.getpostman.com/view/9692837/TW6wHnoz
- Credentials are server-only. Rates are checked again before payment; invalid or absent rates block checkout.
- New orders store NimbusPost as their provider. Historical iThink shipments retain their original tracking integration.
- Booking remains an explicit admin action with the existing unique booking lock; ambiguous failures require reconciliation, not automatic retry. Labels are stored from the booking response.

## Activation required

1. Apply the additive 20260926185826_card_pricing_tax_nimbuspost.sql migration. It preserves past orders and updates only card catalogue prices. Database access was denied by the connected tool in this session, so it was not applied.
2. Configure NimbusPost credentials and pickup JSON, matching pickup PIN, plus parcel dimensions and weight. Keychains are still unpriced; verify package settings per product before pricing those.
3. Validate live quotes, booking and tracking with the NimbusPost account and confirm carrier total_charges includes all intended carrier fees.
4. Set NIMBUSPOST_VERIFIED=true only after verification. Existing PayU and commerce launch gates must also pass.
5. Deploy the code and verify catalogue prices, tax lines and a real provider checkout before opening payments.

No live shipment or charge was created during development.
