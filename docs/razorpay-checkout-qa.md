# Razorpay checkout release checks

## Deployment configuration

- Apply the additive Razorpay checkout and reconciliation-safety migrations before enabling checkout.
- Configure server-only `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and `RAZORPAY_ENV=production`. The current server requires a live key.
- Configure the Razorpay webhook at `https://<deployed-host>/api/shop/razorpay/webhook` for `payment.captured` and `order.paid`, using the matching webhook secret.
- Confirm merchant payment capture is configured. Authorisation alone must remain pending and must not enter the income ledger.
- Preserve the existing Google OAuth, NimbusPost, parcel settings and approved policy configuration. Payment readiness depends on all checkout requirements.
- Verify the deployed environment has the new build, database functions and API routes; linking GitHub, Vercel and Supabase alone does not apply SQL migrations.

## Customer flow checks

| Scenario | Expected result |
| --- | --- |
| Cart checkout | Google sign-in preserves cart and logos. Server-calculated products, offer, tax and shipping make up the Razorpay amount. |
| Buy Now popup | Address stays in the current product page. The native dialog temporarily closes while Razorpay opens, then returns on cancellation or verification errors. |
| Payment preparation | Close button, backdrop and Escape cannot discard a checkout while a request is active. |
| Cancel Razorpay | Cart, address, logo upload IDs and request ID remain available. The next attempt reuses the same unpaid order. Cancellation is not recorded as payment failure or income. |
| Failed attempt followed by retry | Razorpay permits retry. A successful retry clears the prior failure message and proceeds to server verification. |
| SDK blocked or unavailable | A readable connection error appears. Retry can load the SDK again; no order is created before SDK availability. |
| Successful captured payment | Server confirms the signature, owner, provider order and amount. Only then are the purchased cart quantities removed and the owned order shown. |
| New items added in another tab | Only quantities included in the paid checkout are removed. Unrelated items and newly added quantities remain. |
| Buy Now succeeds | The separate shopping cart remains intact. |
| Callback accepted but capture pending | Cart and receipt remain saved. The order page provides status refresh. No second payment is offered while its receipt awaits confirmation. |
| Verification connection failure | A Check payment status action retries verification of the existing receipt; it does not create another payment. |
| Reload during pending verification | Receipt and purchased-item snapshot recover for the same signed-in customer. |
| Change Google account in the same tab | Another customer's receipt does not block the new customer's checkout or expose its order. Server ownership checks still apply. |
| Confirmed previously paid/refunded order | Open the existing owned order; do not launch a new charge for its cached request. |
| Cancelled order with no provider order issued | Server explicitly allows restart; the client clears the old request and uploaded-asset mapping before preparing a fresh attempt. |
| Cancelled order with a provider order issued | Client directs the customer to the existing order/support. It does not blindly create another payable provider order. |

## Payment and bookkeeping checks

- Send the same captured-payment webhook twice and submit the success callback twice. There must be one verified payment and one linked income transaction, with no repeated stock decrement.
- Reject modified amount, order ID, payment ID and signature; reject another user's order or logo.
- Confirm late capture on a cancelled order is reconciled and surfaced for fulfilment/refund review rather than silently dropping collected money.
- Confirm the recorded income includes collected shipping and GST exactly as the order total, without counting the same captured money through an additional manual transaction.
- Check the owner Orders panel, customer orders and finance totals against the same captured order.

## Verification already completed locally

- Ten focused client tests cover callback ordering, retry, dismissal, order mismatch, response validation, SDK loading/retry, paid-cart quantity preservation and customer-bound recovery.
- Scoped checkout/client lint and repository type checking pass.
- Real-provider payment, webhook delivery and modal browser checks must be verified on the deployed build before treating those flows as live-confirmed.
