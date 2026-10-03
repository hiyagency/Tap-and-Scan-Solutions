# Razorpay refunds and cancelled orders

Payments are recorded only after server verification of a captured payment with the exact stored order, INR currency and amount. Authorised or failed payments are not recorded as income. This version does not issue refunds automatically.

## Normal manual refund workflow

1. In Admin → Orders, confirm that the order is **paid** and the payment reference matches the captured payment in Razorpay. If verification is pending, reconcile it before refunding.
2. Process the required refund in the Razorpay dashboard. Wait until the provider reports it as processed/completed; a requested or failed refund is not an expense.
3. Open the same admin order and record a **Completed refund** expense, using the actual amount and the unique Razorpay refund ID as its reference. Use the same provider ID when retrying a save. Do not record the same refund under another reference.
4. The ledger, refunded balance and lifetime cash flow update together. Recording an expense does not transfer funds or issue a gateway refund.

If an owner refunds a payment before its first shop verification, payment history needs support reconciliation rather than another customer charge. Verify captured orders first as described above.

## Late capture on a cancelled or released-stock order

Cancelling an unpaid order releases its reserved stock. An already-open Razorpay window can still finish later: cancellation of a shop order is not cancellation of a gateway transaction.

When a valid captured payment arrives after cancellation, the shop records the income once but keeps the order cancelled and fulfilment blocked. It does not take released stock from another customer or promise dispatch. The order timeline identifies this case. The owner must contact the purchaser and reconcile the order or use the manual refund workflow.

Unpaid stock holds currently remain until owner cancellation; there is no automatic reservation-expiry job in this release. Review pending orders regularly. Never release stock merely because a browser payment window was dismissed or because a verification request timed out.
