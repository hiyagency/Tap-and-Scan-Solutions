import "server-only";
export function shippingReady(){
 return !!(process.env.NIMBUSPOST_API_KEY && process.env.NIMBUSPOST_API_SECRET && /^[1-9]\d{5}$/.test(process.env.NIMBUSPOST_PICKUP_PINCODE || ""));
}
export function launchChecks(){
 return {
  checkoutEnabled:process.env.COMMERCE_LIVE==="true",
  payu:!!(process.env.PAYU_KEY&&process.env.PAYU_SALT&&process.env.PAYU_ENV==="production"),
  logistics:shippingReady()&&!!process.env.NIMBUSPOST_WAREHOUSE_ID&&process.env.NIMBUSPOST_VERIFIED==="true",

  approved:process.env.COMMERCE_POLICIES_APPROVED==="true"&&process.env.COMMERCE_PROVIDERS_VERIFIED==="true"&&!!process.env.SHIPPING_POLICY&&!!process.env.REFUND_POLICY,
 };
}
export const checkoutReady=()=>Object.values(launchChecks()).every(Boolean);
